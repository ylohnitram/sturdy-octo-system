
import { supabase } from './supabaseClient';
import { UserStats, UserProfile, UserTier, JournalEntry, LeaderboardEntry, Gender, TargetGender, Hotspot, RivalRequest, HotspotUser } from '../types';

const RESTRICTED_KEYWORDS = [
    'admin',
    'support',
    'notch',
    'skalp',
    'root',
    'system',
    'moderator',
    'helpdesk',
    'staff',
    'official',
    'server',
    'bot'
];

// Helper to calculate age from DOB
export const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};

export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    if (!username || username.trim().length < 3) return false;

    const lowerUser = username.toLowerCase();

    if (RESTRICTED_KEYWORDS.some(keyword => lowerUser.includes(keyword))) {
        return false;
    }

    try {
        const { count, error } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('username', username);

        if (error) {
            console.warn('Error checking username availability:', error.message);
            return false;
        }

        return count === 0;
    } catch (e) {
        console.error('Unexpected error checking username:', e);
        return false;
    }
};

export const fetchUserData = async (userId: string): Promise<{ profile: UserProfile | null, stats: UserStats | null, restored?: boolean, isOnboardingNeeded?: boolean }> => {
    try {
        const startTime = performance.now();
        let restored = false;

        // PARALLEL QUERIES - Load both profile and stats at the same time
        console.log('[fetchUserData] Starting parallel queries...');
        const queryStart = performance.now();
        const [profileResult, statsResult, notificationCount, unreadConversationsCount] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', userId).single(),
            supabase.from('user_stats').select('*').eq('user_id', userId).single(),
            getUnreadNotificationsCount(userId),
            getUnreadConversationsCount(userId)
        ]);
        const queryTime = performance.now() - queryStart;
        console.log(`[fetchUserData] Queries completed in ${queryTime.toFixed(0)}ms`);

        const { data: profileData, error: profileError } = profileResult;
        const { data: statsData, error: statsError } = statsResult;

        if (profileError || statsError) {
            console.error('Error fetching user data:', profileError, statsError);
            return { profile: null, stats: null };
        }

        // Check for account restoration
        if (profileData && profileData.deletion_scheduled_at) {
            await supabase.from('profiles').update({ deletion_scheduled_at: null }).eq('id', userId);
            restored = true;
            profileData.deletion_scheduled_at = null;
        }

        // Calculate Age Dynamically
        const dynamicAge = profileData.birth_date ? calculateAge(profileData.birth_date) : (profileData.age || 0);

        // Onboarding check: Needs birth_date OR (legacy age > 0) AND avatar AND gender
        const hasAge = profileData.birth_date || (profileData.age && profileData.age > 0);
        const isOnboardingNeeded = !hasAge || !profileData.avatar_url || !profileData.gender;

        // Note: Rank is now fetched separately in LeaderboardView to avoid expensive query here

        // Calculate heat (simplified - based on body count and weekly score)
        const heat = statsData.body_count > 0 || statsData.weekly_score > 0
            ? Math.min(100, Math.round(((statsData.body_count * 10) + (statsData.weekly_score * 2)) / 1.5))
            : 0;

        // Check premium status
        const isPremium = statsData.is_premium === true;
        const tier = isPremium ? UserTier.PREMIUM : (profileData.tier || UserTier.FREE);

        const userStats: UserStats = {
            username: profileData.username || 'Lovce',
            bodyCount: statsData.body_count,
            weeklyScore: statsData.weekly_score || 0,
            matches: 0,
            avgPartnerAge: 0,
            preferredType: 'Neznámý',
            streakDays: 0,
            aiCredits: statsData.ai_credits,
            coins: statsData.coins,
            inviteCode: statsData.invite_code,
            invitesAvailable: statsData.invites_left,
            rank: undefined, // Fetched separately in LeaderboardView
            heat: heat,
            tier: tier,
            isOnline: true,
            notificationCount: notificationCount,
            unreadConversationsCount: unreadConversationsCount
        };

        const userProfile: UserProfile = {
            id: profileData.id,
            name: profileData.username || 'Lovce',
            age: dynamicAge,
            birthDate: profileData.birth_date,
            gender: profileData.gender,
            targetGender: profileData.target_gender || 'both',
            radarRadius: profileData.radar_radius || 10,
            notifyProximity: profileData.notify_proximity !== false, // Default true
            notifyLikes: profileData.notify_likes !== false, // Default true
            bio: profileData.bio || '',
            avatarUrl: profileData.avatar_url || 'https://picsum.photos/200',
            stats: userStats,
            tier: tier,
            isOnline: true,
            distanceKm: 0
        };

        return { profile: userProfile, stats: userStats, restored, isOnboardingNeeded };
    } catch (e) {
        console.error(e);
        return { profile: null, stats: null };
    }
};

export const updateUserPreferences = async (userId: string, gender: Gender, targetGender: TargetGender) => {
    await supabase
        .from('profiles')
        .update({ gender, target_gender: targetGender })
        .eq('id', userId);
};

export const updateNotificationSettings = async (userId: string, settings: { notifyProximity?: boolean, notifyLikes?: boolean, notifyRivals?: boolean }) => {
    const updateData: any = {};
    if (settings.notifyProximity !== undefined) updateData.notify_proximity = settings.notifyProximity;
    if (settings.notifyLikes !== undefined) updateData.notify_likes = settings.notifyLikes;

    await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);
};

export const updateRadarRadius = async (userId: string, radius: number) => {
    await supabase
        .from('profiles')
        .update({ radar_radius: radius })
        .eq('id', userId);
};

export const updateUserLocation = async (userId: string, lat: number, long: number) => {
    const { error } = await supabase
        .from('profiles')
        .update({
            latitude: lat,
            longitude: long,
            last_location_update: new Date().toISOString()
        })
        .eq('id', userId);

    if (error) console.error('Error updating location:', error);
};

export const fetchActiveHotspots = async (radius: number, lat: number, long: number): Promise<Hotspot[]> => {
    const { data, error } = await supabase
        .rpc('get_active_hotspots', {
            radius_km: radius,
            current_lat: lat,
            current_long: long
        });

    if (error) {
        console.error('Error fetching hotspots:', error);
        return [];
    }

    return (data || []).map((spot: any) => ({
        id: spot.id,
        name: spot.name,
        distance: spot.distance,
        count: spot.count,
        targetCount: spot.target_count || 0,
        label: spot.label,
        latitude: spot.latitude,
        longitude: spot.longitude
    }));
};

export const fetchHotspotUsers = async (placeId: string): Promise<HotspotUser[]> => {
    const { data, error } = await supabase
        .rpc('get_hotspot_users', {
            place_id: placeId
        });

    if (error) {
        console.error('Error fetching hotspot users:', error);
        return [];
    }

    return (data || []).map((user: any) => ({
        id: user.id,
        username: user.username || 'Neznámý',
        avatarUrl: user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}`,
        age: user.age || 0,
        bio: user.bio || '',
        bodyCount: user.body_count || 0,
        tier: user.tier || 'FREE',
        distanceKm: user.distance_km || 0,
        status: user.status || 'target'
    }));
};

export const sendLike = async (fromUserId: string, toUserId: string): Promise<{ success: boolean, isMatch: boolean }> => {
    try {
        // 1. Insert Like
        const { error: likeError } = await supabase
            .from('likes')
            .insert({ from_user_id: fromUserId, to_user_id: toUserId });

        if (likeError) {
            if (likeError.code === '23505') return { success: false, isMatch: false }; // Duplicate like
            throw likeError;
        }

        // 2. Check for Mutual Like (Match)
        const { data: mutualLike } = await supabase
            .from('likes')
            .select('id')
            .eq('from_user_id', toUserId)
            .eq('to_user_id', fromUserId)
            .single();

        if (mutualLike) {
            // IT'S A MATCH!

            // A. Create Match Record
            // Ensure consistent ordering of IDs to avoid duplicates if we didn't have unique constraint on (user1, user2)
            // But our table has (user1, user2) unique. Let's just insert.
            // We need to handle the case where user1 < user2 to ensure uniqueness if we enforced it that way, 
            // but for now let's just insert.
            const { error: matchError } = await supabase
                .from('matches')
                .insert({ user1_id: fromUserId, user2_id: toUserId });

            if (!matchError) {
                // B. Notify BOTH users
                await supabase.from('notifications').insert([
                    {
                        user_id: fromUserId,
                        type: 'match',
                        content: 'Máte nový Match! ❤️‍🔥',
                        related_user_id: toUserId
                    },
                    {
                        user_id: toUserId,
                        type: 'match',
                        content: 'Máte nový Match! ❤️‍🔥',
                        related_user_id: fromUserId
                    }
                ]);
                return { success: true, isMatch: true };
            }
        }

        // 3. If not a match, just notify recipient about the like
        await supabase
            .from('notifications')
            .insert({
                user_id: toUserId,
                type: 'like',
                content: 'Někdo ti dal srdíčko! ❤️',
                related_user_id: fromUserId
            });

        return { success: true, isMatch: false };

    } catch (e) {
        console.error('Error sending like:', e);
        return { success: false, isMatch: false };
    }
};

export const recordDismiss = async (fromUserId: string, toUserId: string): Promise<{ success: boolean }> => {
    try {
        const { error } = await supabase
            .from('dismisses')
            .insert({ from_user_id: fromUserId, to_user_id: toUserId });

        if (error) {
            if (error.code === '23505') return { success: false }; // Duplicate dismiss today
            throw error;
        }

        return { success: true };

    } catch (e) {
        console.error('Error recording dismiss:', e);
        return { success: false };
    }
};


export const fetchDiscoveryCandidates = async (currentUserId: string): Promise<UserProfile[]> => {
    try {
        // 1. Get Current User Prefs
        const { data: currentUser } = await supabase
            .from('profiles')
            .select('gender, target_gender, radar_radius')
            .eq('id', currentUserId)
            .single();

        if (!currentUser) return [];

        const myGender = currentUser.gender;
        const myTarget = currentUser.target_gender; // 'men', 'women', 'both'
        const radius = currentUser.radar_radius || 10;

        // 1.5 Get Excluded IDs (Ghosted + Matched + Dismissed Today)
        const { data: excludedData } = await supabase.rpc('get_discovery_exclusions', { p_user_id: currentUserId });
        const excludedIds = excludedData?.map((r: any) => r.excluded_id) || [];

        // 2. Build Query
        let query = supabase
            .from('profiles')
            .select(`*, user_stats (*)`)
            .neq('id', currentUserId)
            .is('deletion_scheduled_at', null);

        if (excludedIds.length > 0) {
            query = query.not('id', 'in', `(${excludedIds.join(',')})`);
        }

        query = query.limit(20);

        // Filter: Who I want to see
        if (myTarget === 'men') {
            query = query.eq('gender', 'male');
        } else if (myTarget === 'women') {
            query = query.eq('gender', 'female');
        }
        // If 'both', we don't add a gender filter

        const { data: profiles, error } = await query;

        if (error) throw error;

        if (!profiles || profiles.length === 0) return [];

        // 3. Client-side Filtering: Who wants to see ME? & Distance
        const filteredProfiles = profiles.filter((p: any) => {
            // Does this person want to see me?
            const theirTarget = p.target_gender || 'both';
            if (theirTarget !== 'both') {
                const lookingForMen = theirTarget === 'men';
                const lookingForWomen = theirTarget === 'women';
                if (lookingForMen && myGender !== 'male') return false;
                if (lookingForWomen && myGender !== 'female') return false;
            }

            // Mock Distance Filter
            const mockDist = Math.floor(Math.random() * 20) + 1;
            if (mockDist > radius) return false;

            return true;
        });

        return filteredProfiles.map((p: any) => ({
            id: p.id,
            name: p.username || 'Neznámý',
            age: p.birth_date ? calculateAge(p.birth_date) : (p.age || 20),
            gender: p.gender,
            bio: p.bio || 'Bez popisu...',
            avatarUrl: p.avatar_url || `https://picsum.photos/400/600?random=${p.id}`,
            stats: {
                bodyCount: p.user_stats?.body_count || 0,
                weeklyScore: 0,
                matches: 0,
                avgPartnerAge: 0,
                preferredType: '',
                streakDays: 0,
                aiCredits: 0,
                coins: 0,
                inviteCode: '',
                invitesAvailable: 0
            },
            tier: p.tier || UserTier.FREE,
            isOnline: Math.random() > 0.5,
            distanceKm: Math.floor(Math.random() * radius) + 1
        }));

    } catch (e) {
        console.error('Error fetching candidates:', e);
        return [];
    }
};

export const uploadAvatar = async (userId: string, file: File): Promise<string | null> => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

        await supabase
            .from('profiles')
            .update({ avatar_url: data.publicUrl })
            .eq('id', userId);

        return data.publicUrl;
    } catch (error) {
        console.error('Error uploading avatar:', error);
        alert('Nepodařilo se nahrát fotku.');
        return null;
    }
};

export const updateUserBio = async (userId: string, bio: string) => {
    await supabase.from('profiles').update({ bio }).eq('id', userId);
};

export const saveUserBirthDate = async (userId: string, birthDate: string) => {
    await supabase.from('profiles').update({ birth_date: birthDate }).eq('id', userId);
};

export const searchUsers = async (query: string, currentUserId: string): Promise<UserProfile[]> => {
    if (!query || query.length < 2) return [];

    try {
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .neq('id', currentUserId)
            .ilike('username', `%${query}%`)
            .limit(5);

        if (error) throw error;

        return profiles.map(p => ({
            id: p.id,
            name: p.username || 'Neznámý',
            age: 0,
            bio: '',
            avatarUrl: p.avatar_url || '',
            stats: {} as any,
            tier: UserTier.FREE,
            isOnline: false,
            distanceKm: 0
        }));
    } catch (e) {
        console.error(e);
        return [];
    }
};

// Search only users that the current user has matched with AND both sent messages
export const searchMatchedUsers = async (query: string, currentUserId: string): Promise<UserProfile[]> => {
    if (!query || query.length < 2) return [];

    try {
        // Get all matched user IDs
        const { data: matches } = await supabase
            .from('matches')
            .select('user1_id, user2_id')
            .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`);

        if (!matches || matches.length === 0) return [];

        // Extract partner IDs
        const matchedUserIds = matches.map(m =>
            m.user1_id === currentUserId ? m.user2_id : m.user1_id
        );

        // Search within matched users
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', matchedUserIds)
            .ilike('username', `%${query}%`)
            .limit(5);

        if (error) throw error;

        // For each profile, check if both users have sent messages
        const validProfiles = await Promise.all(
            profiles.map(async (p) => {
                const eligibility = await checkDiaryEligibility(currentUserId, p.id);
                if (eligibility.canAdd) {
                    return {
                        id: p.id,
                        name: p.username || 'Neznámý',
                        age: eligibility.ageAtMatch || 0,
                        bio: '',
                        avatarUrl: p.avatar_url || '',
                        stats: {} as any,
                        tier: UserTier.FREE,
                        isOnline: false,
                        distanceKm: 0
                    };
                }
                return null;
            })
        );

        return validProfiles.filter(Boolean) as UserProfile[];
    } catch (e) {
        console.error(e);
        return [];
    }
};

// Fetch all matched users for diary selection (sorted by match date, newest first)
export const fetchAllMatchedUsersForDiary = async (): Promise<Array<UserProfile & {
    matchCreatedAt: string;
    isGhostedByMe: boolean;
    ageAtMatch?: number;
}>> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        // 1. Get all matches from DB (to get created_at and ALL matches)
        const { data: dbMatches } = await supabase
            .from('matches')
            .select('id, user1_id, user2_id, created_at')
            .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
            .order('created_at', { ascending: false }); // Newest first

        if (!dbMatches || dbMatches.length === 0) return [];

        // 2. Get active chat matches (to validate messages)
        // This uses the EXACT same logic as ChatView, so if it shows there, it will show here.
        const chatMatches = await fetchMatches();
        const chatMap = new Map(chatMatches.map(m => [m.partnerId, m]));

        // 3. Get ghost list (users I ghosted)
        const { data: ghostedUsers } = await supabase.rpc('get_ghost_list');
        const ghostedIds = new Set((ghostedUsers || []).map((g: any) => g.blocked_id));

        // 4. Filter and build profiles
        const processedPartnerIds = new Set<string>();

        const profiles = await Promise.all(
            dbMatches.map(async (match) => {
                const partnerId = match.user1_id === user.id ? match.user2_id : match.user1_id;

                // Deduplication: If we already processed this partner, skip (since matches are sorted by newest, we keep the latest)
                if (processedPartnerIds.has(partnerId)) return null;
                processedPartnerIds.add(partnerId);

                const isGhosted = ghostedIds.has(partnerId);
                const chatMatch = chatMap.get(partnerId);

                // Eligibility Check:
                // 1. Must be ghosted by me OR
                // 2. Must have an active chat with at least one message (lastMessage is present)
                const hasMessages = chatMatch && (chatMatch.lastMessage || chatMatch.lastMessageTime);

                if (!isGhosted && !hasMessages) {
                    return null;
                }

                // Fetch partner profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id, username, avatar_url, birth_date')
                    .eq('id', partnerId)
                    .single();

                if (!profile) return null;

                // Calculate age at match time
                let ageAtMatch: number | undefined;
                if (profile.birth_date) {
                    const birthDate = new Date(profile.birth_date);
                    const matchDate = new Date(match.created_at);
                    let age = matchDate.getFullYear() - birthDate.getFullYear();
                    const m = matchDate.getMonth() - birthDate.getMonth();
                    if (m < 0 || (m === 0 && matchDate.getDate() < birthDate.getDate())) {
                        age--;
                    }
                    ageAtMatch = age;
                }

                return {
                    id: profile.id,
                    name: profile.username || 'Neznámý',
                    age: ageAtMatch || 0,
                    bio: '',
                    avatarUrl: profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.username}`,
                    stats: {} as any,
                    tier: UserTier.FREE,
                    isOnline: false,
                    distanceKm: 0,
                    matchCreatedAt: match.created_at,
                    isGhostedByMe: isGhosted,
                    ageAtMatch: ageAtMatch
                };
            })
        );

        return profiles.filter(Boolean) as any[];
    } catch (e) {
        console.error('Error fetching matched users for diary:', e);
        return [];
    }
};

export const fetchLeaderboard = async (): Promise<LeaderboardEntry[]> => {
    try {
        const { data, error } = await supabase
            .from('user_stats')
            .select(`
                body_count, 
                weekly_score,
                profiles!inner (
                    id, username, avatar_url, age, birth_date, deletion_scheduled_at, tier
                )
            `)
            .order('body_count', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Detailed Leaderboard Error:', JSON.stringify(error, null, 2));
            throw error;
        }

        if (!data) return [];

        return data.map((item: any, index: number) => {
            const profile = item.profiles;

            // Skip if profile is missing or scheduled for deletion (double check)
            if (!profile || profile.deletion_scheduled_at) return null;

            const age = profile.birth_date ? calculateAge(profile.birth_date) : (profile.age || 0);

            return {
                rank: index + 1,
                score: item.body_count,
                trend: 'same',
                user: {
                    id: profile.id,
                    name: profile.username || 'Neznámý',
                    age: age,
                    bio: '',
                    avatarUrl: profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.username}`,
                    stats: {
                        bodyCount: item.body_count,
                        weeklyScore: item.weekly_score || 0,
                        matches: 0, avgPartnerAge: 0, preferredType: '', streakDays: 0, aiCredits: 0, coins: 0, inviteCode: '', invitesAvailable: 0
                    },
                    tier: profile.tier || UserTier.FREE,
                    isOnline: false,
                    distanceKm: 0
                }
            };
        }).filter(Boolean) as LeaderboardEntry[];

    } catch (e) {
        console.error('Error fetching leaderboard:', e);
        return [];
    }
};

export const fetchJournalStats = async (userId: string) => {
    const { data: entries } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId);

    if (!entries || entries.length === 0) return null;

    const ageDist = { '18-20': 0, '21-23': 0, '24-26': 0, '27+': 0 };
    let totalAge = 0;
    let ageCount = 0;

    entries.forEach(e => {
        if (e.partner_age) {
            totalAge += e.partner_age;
            ageCount++;
            if (e.partner_age <= 20) ageDist['18-20']++;
            else if (e.partner_age <= 23) ageDist['21-23']++;
            else if (e.partner_age <= 26) ageDist['24-26']++;
            else ageDist['27+']++;
        }
    });

    const activityMap = new Map<string, number>();
    const months = ['Jan', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čer', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro'];

    entries.forEach(e => {
        const d = new Date(e.date);
        const monthName = months[d.getMonth()];
        activityMap.set(monthName, (activityMap.get(monthName) || 0) + 1);
    });

    const activityData = Array.from(activityMap.entries()).map(([month, score]) => ({ month, score }));

    return {
        ageDistribution: Object.keys(ageDist).map(key => ({ range: key, count: ageDist[key as keyof typeof ageDist] })),
        activityData: activityData,
        avgAge: ageCount > 0 ? (totalAge / ageCount).toFixed(1) : '0',
        totalCount: entries.length
    };
};

export const scheduleAccountDeletion = async (userId: string) => {
    const fourteenDaysFromNow = new Date();
    fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

    await supabase
        .from('profiles')
        .update({ deletion_scheduled_at: fourteenDaysFromNow.toISOString() })
        .eq('id', userId);
};

// --- GALLERY FUNCTIONS ---

export interface GalleryImage {
    id: string;
    imageUrl: string;
    isPrivate: boolean;
    isUnlocked?: boolean; // For frontend logic
    caption?: string; // Optional caption/description
    createdAt: string;
}

export const fetchUserGallery = async (userId: string): Promise<GalleryImage[]> => {
    try {
        const { data, error } = await supabase
            .from('gallery_images')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map((img: any) => ({
            id: img.id,
            imageUrl: img.image_url,
            isPrivate: img.is_private,
            isUnlocked: true, // Owner always sees unlocked
            caption: img.caption,
            createdAt: img.created_at
        }));
    } catch (e) {
        console.error('Error fetching gallery:', e);
        return [];
    }
};

export const fetchPublicGallery = async (targetUserId: string): Promise<GalleryImage[]> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const viewerId = user?.id;

        // Fetch all gallery images
        const { data: images, error: imagesError } = await supabase
            .from('gallery_images')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: true }); // ASC for proper indexing

        console.log('📸 fetchPublicGallery DEBUG:', {
            targetUserId,
            imagesCount: images?.length || 0,
            images,
            error: imagesError
        });

        if (imagesError) throw imagesError;

        // If no images, return empty
        if (!images || images.length === 0) {
            return [];
        }

        // If not logged in, show all as locked
        if (!viewerId) {
            return images.map((img: any) => ({
                id: img.id,
                imageUrl: img.image_url,
                isPrivate: img.is_private,
                isUnlocked: !img.is_private,
                createdAt: img.created_at
            }));
        }

        // Try to fetch user's unlocked images (image-level)
        const { data: unlocks, error: unlocksError } = await supabase
            .from('gallery_image_unlocks')
            .select('image_id, unlock_type, expires_at')
            .eq('viewer_id', viewerId);

        // If unlock query fails (table doesn't exist, permissions, etc.)
        // -> Just show all private images as locked
        if (unlocksError) {
            console.warn('gallery_image_unlocks query failed, showing all as locked:', unlocksError);
            return images.map((img: any) => ({
                id: img.id,
                imageUrl: img.image_url,
                isPrivate: img.is_private,
                isUnlocked: !img.is_private, // Only public are unlocked
                createdAt: img.created_at
            }));
        }

        // Create map of unlocked image IDs
        const unlockedMap = new Map<string, boolean>();
        (unlocks || []).forEach((unlock: any) => {
            // Check if still valid
            if (unlock.unlock_type === 'permanent') {
                unlockedMap.set(unlock.image_id, true);
            } else if (unlock.expires_at && new Date(unlock.expires_at) > new Date()) {
                unlockedMap.set(unlock.image_id, true);
            }
        });

        // Map images with unlock status
        return images.map((img: any) => ({
            id: img.id,
            imageUrl: img.image_url,
            isPrivate: img.is_private,
            isUnlocked: !img.is_private || unlockedMap.has(img.id),
            caption: img.caption,
            createdAt: img.created_at
        }));
    } catch (e) {
        console.error('Error fetching public gallery:', e);
        return [];
    }
};

export const uploadGalleryImage = async (userId: string, file: File, isPrivate: boolean, caption?: string): Promise<GalleryImage | null> => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `gallery/${userId}/${Date.now()}.${fileExt}`;

        // 1. Upload to Storage
        const { error: uploadError } = await supabase.storage
            .from('gallery') // Ensure this bucket exists!
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('gallery').getPublicUrl(fileName);
        const imageUrl = publicUrlData.publicUrl;

        // 2. Insert into DB
        const { data, error: dbError } = await supabase
            .from('gallery_images')
            .insert({
                user_id: userId,
                image_url: imageUrl,
                is_private: isPrivate,
                caption: caption || null
            })
            .select()
            .single();

        if (dbError) throw dbError;

        return {
            id: data.id,
            imageUrl: data.image_url,
            isPrivate: data.is_private,
            isUnlocked: true,
            caption: data.caption,
            createdAt: data.created_at
        };

    } catch (e) {
        console.error('Error uploading gallery image:', e);
        return null;
    }
};

export const deleteGalleryImage = async (imageId: string) => {
    try {
        const { error } = await supabase
            .from('gallery_images')
            .delete()
            .eq('id', imageId);

        if (error) throw error;
        return true;
    } catch (e) {
        console.error('Error deleting image:', e);
        return false;
    }
};

export const unlockGalleryImage = async (imageId: string): Promise<boolean> => {
    try {
        const { data, error } = await supabase.rpc('unlock_image', { img_id: imageId });
        if (error) throw error;
        return data; // Returns true if successful
    } catch (e) {
        console.error('Error unlocking image:', e);
        return false;
    }
};
export const getDailyLikeCount = async (userId: string): Promise<number> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('from_user_id', userId)
        .gte('created_at', today.toISOString());

    if (error) {
        console.error('Error counting daily likes:', error);
        return 0;
    }

    return count || 0;
};

// --- RIVALS FUNCTIONS ---

export const sendRivalRequest = async (targetUsername: string): Promise<{ success: boolean, message: string }> => {
    try {
        const { data: users, error: searchError } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', targetUsername)
            .single();

        if (searchError || !users) return { success: false, message: 'Uživatel nenalezen.' };

        const targetUserId = users.id;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, message: 'Nejste přihlášen.' };
        if (user.id === targetUserId) return { success: false, message: 'Nemůžete vyzvat sami sebe.' };

        const { error: insertError } = await supabase
            .from('rivals')
            .insert({ requester_id: user.id, recipient_id: targetUserId });

        if (insertError) {
            if (insertError.code === '23505') return { success: false, message: 'Výzva již byla odeslána.' };
            throw insertError;
        }

        return { success: true, message: 'Výzva odeslána!' };
    } catch (e) {
        console.error('Error sending rival request:', e);
        return { success: false, message: 'Chyba při odesílání.' };
    }
};

export const fetchPendingRivalRequests = async (): Promise<RivalRequest[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('rivals')
        .select(`
            id,
            status,
            created_at,
            requester:profiles!requester_id (id, username, avatar_url)
        `)
        .eq('recipient_id', user.id)
        .eq('status', 'pending');

    if (error) {
        console.error('Error fetching rival requests:', error);
        return [];
    }

    return data.map((r: any) => ({
        id: r.id,
        requester: {
            id: r.requester.id,
            username: r.requester.username,
            avatarUrl: r.requester.avatar_url
        },
        status: r.status,
        createdAt: r.created_at
    }));
};

export const respondToRivalRequest = async (requestId: string, accept: boolean): Promise<boolean> => {
    if (accept) {
        const { error } = await supabase
            .from('rivals')
            .update({ status: 'accepted' })
            .eq('id', requestId);
        return !error;
    } else {
        const { error } = await supabase
            .from('rivals')
            .delete()
            .eq('id', requestId);
        return !error;
    }
};

export const fetchRivalsLeaderboard = async (): Promise<LeaderboardEntry[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase.rpc('get_rivals_leaderboard', { user_id: user.id });

    if (error) {
        console.error('Error fetching rivals leaderboard:', error);
        return [];
    }

    return (data || []).map((item: any) => ({
        id: item.id,
        name: item.username || 'Neznámý',
        score: item.body_count,
        avatarUrl: item.avatar_url,
        change: 0,
        stats: {
            bodyCount: item.body_count,
            weeklyScore: item.weekly_score || 0,
            matches: 0, avgPartnerAge: 0, preferredType: '', streakDays: 0, aiCredits: 0, coins: 0, inviteCode: '', invitesAvailable: 0
        },
        tier: item.tier || UserTier.FREE,
        isOnline: false,
        distanceKm: 0
    })).sort((a: any, b: any) => b.score - a.score);
};

// --- NOTIFICATIONS FUNCTIONS ---

export const getUnreadNotificationsCount = async (userId: string): Promise<number> => {
    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('read_at', null);

    if (error) {
        console.error('Error counting unread notifications:', error);
        return 0;
    }

    return count || 0;
};

export const getUnreadConversationsCount = async (userId: string): Promise<number> => {
    const { data, error } = await supabase.rpc('get_unread_conversations_count', { p_user_id: userId });
    if (error) {
        console.error('Error fetching unread conversations count:', error);
        return 0;
    }
    return data || 0;
};
// --- CHAT FUNCTIONS ---

export interface ChatMessage {
    id: string;
    matchId: string;
    senderId: string;
    content: string;
    type?: 'text' | 'image' | 'audio'; // Message type
    mediaUrl?: string; // URL to media file
    metadata?: {
        duration?: number; // For audio (seconds)
        width?: number; // For images
        height?: number; // For images
        size?: number; // File size in bytes
        mimeType?: string; // MIME type
    };
    createdAt: string;
    readAt?: string;
}

export interface MatchPreview {
    matchId: string;
    partnerId: string;
    partnerUsername: string;
    partnerAvatar: string;
    partnerBio?: string;
    lastMessage?: string;
    lastMessageTime?: string;
    unreadCount: number;
}

export const fetchMatches = async (): Promise<MatchPreview[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase.rpc('get_user_matches', { p_user_id: user.id });

    if (error) {
        console.error('Error fetching matches:', error);
        return [];
    }

    return (data || []).map((m: any) => ({
        matchId: m.match_id,
        partnerId: m.partner_id,
        partnerUsername: m.partner_username,
        partnerAvatar: m.partner_avatar,
        partnerBio: m.partner_bio,
        lastMessage: m.last_message,
        lastMessageTime: m.last_message_time,
        unreadCount: m.unread_count
    }));
};

export const checkMatchStatus = async (targetUserId: string): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
        .from('matches')
        .select('id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${user.id})`)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
        console.error('Error checking match status:', error);
    }

    return !!data;
};

export const unmatchUser = async (targetUserId: string): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    try {
        // 1. Delete from matches
        const { error: matchError } = await supabase
            .from('matches')
            .delete()
            .or(`and(user1_id.eq.${user.id},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${user.id})`);

        if (matchError) throw matchError;

        // 2. Delete likes (both directions to be clean)
        await supabase
            .from('likes')
            .delete()
            .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${targetUserId}),and(from_user_id.eq.${targetUserId},to_user_id.eq.${user.id})`);

        return true;
    } catch (e) {
        console.error('Error unmatching user:', e);
        return false;
    }
};

export const fetchConversation = async (partnerId: string): Promise<ChatMessage[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase.rpc('get_conversation_messages', {
        p_user_id: user.id,
        p_partner_id: partnerId
    });

    if (error) {
        console.error('Error fetching conversation:', error);
        return [];
    }

    return (data || []).map((m: any) => ({
        id: m.id,
        matchId: m.match_id,
        senderId: m.sender_id,
        content: m.content || '',
        type: m.type || 'text',
        mediaUrl: m.media_url,
        metadata: m.metadata || {},
        createdAt: m.created_at,
        readAt: m.read_at
    }));
};

export interface SendMessageParams {
    matchId: string;
    content?: string; // Text content or caption
    file?: File; // Media file (image or audio)
    type?: 'text' | 'image' | 'audio';
    metadata?: any; // Additional metadata
}

export const sendMessage = async (
    matchId: string,
    content: string,
    file?: File,
    type: 'text' | 'image' | 'audio' = 'text',
    metadata?: any
): Promise<ChatMessage | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    let mediaUrl: string | undefined;
    let finalMetadata = metadata || {};

    // If there's a file, upload it to storage
    if (file && (type === 'image' || type === 'audio')) {
        try {
            const fileExt = file.name.split('.').pop();
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(7);
            const fileName = `${matchId}/${timestamp}_${randomStr}.${fileExt}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('chat-media')
                .upload(fileName, file);

            if (uploadError) {
                console.error('Error uploading media:', uploadError);
                throw uploadError;
            }

            // Get signed URL for private bucket (expires in 1 year)
            const { data: urlData, error: urlError } = await supabase.storage
                .from('chat-media')
                .createSignedUrl(fileName, 31536000); // 1 year in seconds

            if (urlError || !urlData) {
                console.error('Error creating signed URL:', urlError);
                throw urlError || new Error('Failed to create signed URL');
            }

            mediaUrl = urlData.signedUrl;

            // Add file metadata
            finalMetadata = {
                ...finalMetadata,
                size: file.size,
                mimeType: file.type
            };
        } catch (error) {
            console.error('Error uploading media file:', error);
            return null;
        }
    }

    // Insert message into database
    const { data, error } = await supabase
        .from('messages')
        .insert({
            match_id: matchId,
            sender_id: user.id,
            content: content || null,
            type: type,
            media_url: mediaUrl,
            metadata: finalMetadata
        })
        .select()
        .single();

    if (error) {
        console.error('Error sending message:', error);
        return null;
    }

    return {
        id: data.id,
        matchId: data.match_id,
        senderId: data.sender_id,
        content: data.content || '',
        type: data.type || 'text',
        mediaUrl: data.media_url,
        metadata: data.metadata || {},
        createdAt: data.created_at,
        readAt: data.read_at
    };
};

export const ghostUser = async (targetUserId: string): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.rpc('ghost_user', {
        p_blocker_id: user.id,
        p_blocked_id: targetUserId
    });

    if (error) {
        console.error('Error ghosting user:', error);
        return false;
    }

    return true;
};

export const markConversationAsRead = async (partnerId: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.rpc('mark_conversation_as_read', {
        p_user_id: user.id,
        p_partner_id: partnerId
    });

    if (error) {
        console.error('Error marking conversation as read:', error);
    }
};

export const unghostUser = async (targetUserId: string): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.rpc('unghost_user', {
        p_blocker_id: user.id,
        p_blocked_id: targetUserId
    });

    if (error) {
        console.error('Error unghosting user:', error);
        return false;
    }

    return true;
};

export interface GhostedUser {
    blockedId: string;
    username: string;
    avatarUrl: string;
    blockedAt: string;
}

export const fetchGhostList = async (): Promise<GhostedUser[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase.rpc('get_ghost_list', {
        p_user_id: user.id
    });

    if (error) {
        console.error('Error fetching ghost list:', error);
        return [];
    }

    return (data || []).map((item: any) => ({
        blockedId: item.blocked_id,
        username: item.username,
        avatarUrl: item.avatar_url,
        blockedAt: item.blocked_at
    }));
};

export const checkDiaryEligibility = async (currentUserId: string, partnerId: string): Promise<{ canAdd: boolean, ageAtMatch?: number }> => {
    try {
        // 1. Check Match
        const { data: match } = await supabase
            .from('matches')
            .select('created_at')
            .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${partnerId}),and(user1_id.eq.${partnerId},user2_id.eq.${currentUserId})`)
            .single();

        if (!match) return { canAdd: false };

        // 2. Check Ghost Status
        const { data: ghost } = await supabase
            .from('blocked_users')
            .select('id')
            .eq('blocker_id', currentUserId)
            .eq('blocked_id', partnerId)
            .single();

        const isGhosted = !!ghost;

        // 3. Check Messages (if not ghosted)
        let hasMessages = false;
        if (!isGhosted) {
            const { count } = await supabase
                .from('messages')
                .select('id', { count: 'exact', head: true })
                .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUserId})`);

            hasMessages = (count || 0) > 0;
        }

        if (!isGhosted && !hasMessages) return { canAdd: false };

        // 4. Calculate Age at Match
        const { data: profile } = await supabase
            .from('profiles')
            .select('birth_date')
            .eq('id', partnerId)
            .single();

        let ageAtMatch: number | undefined;
        if (profile?.birth_date) {
            const birthDate = new Date(profile.birth_date);
            const matchDate = new Date(match.created_at);
            let age = matchDate.getFullYear() - birthDate.getFullYear();
            const m = matchDate.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && matchDate.getDate() < birthDate.getDate())) {
                age--;
            }
            ageAtMatch = age;
        }

        return { canAdd: true, ageAtMatch };

    } catch (e) {
        console.error('Error checking diary eligibility:', e);
        return { canAdd: false };
    }
};
