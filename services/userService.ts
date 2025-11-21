
import { supabase } from './supabaseClient';
import { UserStats, UserProfile, UserTier, JournalEntry, LeaderboardEntry, Gender, TargetGender, Hotspot } from '../types';

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
        let restored = false;

        let { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileData && profileData.deletion_scheduled_at) {
            await supabase.from('profiles').update({ deletion_scheduled_at: null }).eq('id', userId);
            restored = true;
            profileData.deletion_scheduled_at = null;
        }

        let { data: statsData, error: statsError } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (profileError || statsError) {
            console.error('Error fetching user data:', profileError, statsError);
            return { profile: null, stats: null };
        }

        // Calculate Age Dynamically
        const dynamicAge = profileData.birth_date ? calculateAge(profileData.birth_date) : (profileData.age || 0);

        // Onboarding check: Needs birth_date OR (legacy age > 0) AND avatar AND gender
        const hasAge = profileData.birth_date || (profileData.age && profileData.age > 0);
        const isOnboardingNeeded = !hasAge || !profileData.avatar_url || !profileData.gender;

        // Fetch user's rank from leaderboard
        let userRank: number | undefined = undefined;
        try {
            const leaderboard = await fetchLeaderboard();
            const userEntry = leaderboard.find(entry => entry.user.id === userId);
            if (userEntry) {
                userRank = userEntry.rank;
            }
        } catch (e) {
            console.error('Error fetching rank:', e);
        }

        // Calculate heat (simplified - based on body count and weekly score)
        const heat = statsData.body_count > 0 || statsData.weekly_score > 0
            ? Math.min(100, Math.round(((statsData.body_count * 10) + (statsData.weekly_score * 2)) / 1.5))
            : 0;

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
            rank: userRank,
            heat: heat,
            tier: statsData.is_premium ? UserTier.PREMIUM : UserTier.FREE,
            isOnline: true
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
            tier: statsData.is_premium ? UserTier.PREMIUM : UserTier.FREE,
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

export const updateNotificationSettings = async (userId: string, settings: { notifyProximity?: boolean, notifyLikes?: boolean }) => {
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

    return data || [];
};

export const sendLike = async (fromUserId: string, toUserId: string) => {
    try {
        // 1. Insert Like
        const { error: likeError } = await supabase
            .from('likes')
            .insert({ from_user_id: fromUserId, to_user_id: toUserId });

        if (likeError) {
            if (likeError.code === '23505') return; // Duplicate like (already liked)
            throw likeError;
        }

        // 2. Create Notification for recipient
        await supabase
            .from('notifications')
            .insert({
                user_id: toUserId,
                type: 'like',
                content: 'Někdo ti dal srdíčko! ❤️',
            });

    } catch (e) {
        console.error('Error sending like:', e);
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

        // 2. Build Query
        let query = supabase
            .from('profiles')
            .select(`*, user_stats (*)`)
            .neq('id', currentUserId)
            .is('deletion_scheduled_at', null)
            .limit(20);

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
            tier: p.user_stats?.is_premium ? UserTier.PREMIUM : UserTier.FREE,
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

export const fetchLeaderboard = async (): Promise<LeaderboardEntry[]> => {
    try {
        const { data, error } = await supabase
            .from('user_stats')
            .select(`
                body_count, 
                weekly_score,
                is_premium,
                profiles!inner (
                    id, username, avatar_url, age, birth_date, deletion_scheduled_at
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
                    tier: item.is_premium ? UserTier.PREMIUM : UserTier.FREE,
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
            createdAt: img.created_at
        }));
    } catch (e) {
        console.error('Error fetching gallery:', e);
        return [];
    }
};

export const uploadGalleryImage = async (userId: string, file: File, isPrivate: boolean): Promise<GalleryImage | null> => {
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
                is_private: isPrivate
            })
            .select()
            .single();

        if (dbError) throw dbError;

        return {
            id: data.id,
            imageUrl: data.image_url,
            isPrivate: data.is_private,
            isUnlocked: true,
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
