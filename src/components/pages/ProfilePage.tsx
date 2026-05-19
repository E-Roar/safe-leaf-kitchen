import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CommunityService } from "@/services/communityService";
import type { Profile, CommunityRecipe } from "@/types/community";
import { 
  User, 
  MapPin, 
  Globe, 
  Calendar, 
  Award, 
  Edit2, 
  LogOut, 
  ChefHat, 
  Heart, 
  MessageCircle,
  Loader2,
  Settings,
  Shield,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Save,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import CreateRecipeModal from "@/components/features/CreateRecipeModal";
import { recipes as staticRecipes, Recipe } from "@/data/recipes";
import { toast } from "sonner";

const RECIPES_PER_PAGE = 12;

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRecipes, setUserRecipes] = useState<CommunityRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [recipeToEdit, setRecipeToEdit] = useState<CommunityRecipe | null>(null);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [adminPage, setAdminPage] = useState(0);
  const navigate = useNavigate();

  const isAdmin = user?.email === "admin@safeleafkitchen.com" || user?.role === "admin" || user?.app_metadata?.role === "admin";

  useEffect(() => {
    if (profile) {
      setEditName(profile.display_name || '');
      setEditBio(profile.bio || '');
      setEditLocation(profile.location || '');
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setSavingProfile(true);
    const success = await CommunityService.updateProfile(user.id, {
      display_name: editName,
      bio: editBio,
      location: editLocation,
    });
    if (success) {
      toast.success('Profile updated');
      setProfile(prev => prev ? { ...prev, display_name: editName, bio: editBio, location: editLocation } : prev);
      setIsEditingProfile(false);
    } else {
      toast.error('Failed to update profile');
    }
    setSavingProfile(false);
  };

  const loadProfileData = async () => {
    if (!user) return;
    setIsLoading(true);
    const [profileData, recipeData] = await Promise.all([
      CommunityService.getProfile(user.id),
      CommunityService.getRecipes({ status: 'all' })
    ]);
    
    setProfile(profileData);
    setUserRecipes(recipeData.filter(r => r.created_by === user.id));
    setIsLoading(false);
  };

  useEffect(() => {
    loadProfileData();
  }, [user]);

  const totalAdminPages = Math.ceil(staticRecipes.length / RECIPES_PER_PAGE);
  const adminPaginatedRecipes = staticRecipes.slice(
    adminPage * RECIPES_PER_PAGE,
    (adminPage + 1) * RECIPES_PER_PAGE
  );

  const handleEditRecipe = (recipe: CommunityRecipe) => {
    setRecipeToEdit(recipe);
    setIsRecipeModalOpen(true);
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!confirm("Are you sure you want to delete this recipe?")) return;
    
    const success = await CommunityService.deleteRecipe(recipeId);
    if (success) {
      toast.success("Recipe deleted");
      loadProfileData();
    } else {
      toast.error("Failed to delete recipe");
    }
  };

  const handleRecipeClick = (recipeId: string) => {
    window.dispatchEvent(new CustomEvent('navigateToRecipe', { detail: { recipeId } }));
  };

  const getRecipeImage = (recipe: Recipe) => {
    if (recipe.image_url) return recipe.image_url;
    const folderName = (recipe.title?.en || '')
      .toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
    return `/images/recipes/${folderName}/1.png`;
  };

  if (isLoading) {
    return (
      <div className="pt-24 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-24 px-4 text-center">
        <User className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-20" />
        <h2 className="text-xl font-bold">Not Signed In</h2>
        <p className="text-muted-foreground mt-2">Sign in to view your profile and shared recipes.</p>
      </div>
    );
  }

  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-8">
        
        <div className="bg-background border border-border rounded-[2.5rem] overflow-hidden shadow-2xl mb-8">
          <div className="h-32 bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-teal-500/20 relative">
            <button
              onClick={() => {
                if (isAdmin) {
                  navigate('/admin');
                } else {
                  setIsEditingProfile(!isEditingProfile);
                }
              }}
              className="absolute top-4 right-4 p-2 bg-background/80 backdrop-blur-md rounded-full border border-border hover:bg-muted transition-all"
              title={isAdmin ? 'Admin Dashboard' : 'Edit Profile'}
            >
              {isAdmin ? <Shield className="w-4 h-4 text-amber-500" /> : <Settings className="w-4 h-4 text-foreground" />}
            </button>
          </div>
          
          <div className="px-4 md:px-8 pb-8">
            <div className="relative -mt-16 flex flex-col md:flex-row md:items-end gap-6 mb-6">
              <div className="w-32 h-32 rounded-[2rem] bg-background border-4 border-background shadow-xl flex items-center justify-center text-6xl shrink-0 overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>{profile?.avatar_emoji || '👤'}</span>
                )}
              </div>
              
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    {profile?.display_name || user.email?.split('@')[0]}
                  </h1>
                  {profile?.is_verified && (
                    <Award className="w-5 h-5 text-primary fill-primary/10" />
                  )}
                  <span className="bg-primary/10 text-primary text-[10px] uppercase tracking-widest font-black px-2 py-0.5 rounded-full">
                    {isAdmin ? 'Admin' : profile?.role || 'Member'}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm max-w-xl">
                  {profile?.bio || "No bio yet. Tell the community about your love for traditional Moroccan cuisine!"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 py-6 border-t border-border/50">
              {profile?.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 text-red-500" /> {profile.location}
                </div>
              )}
              {profile?.website && (
                <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Globe className="w-4 h-4" /> {profile.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" /> Joined {new Date(profile?.created_at || user.created_at).toLocaleDateString()}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => signOut()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold bg-muted text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all border border-transparent hover:border-red-500/20"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>

        {isEditingProfile && !isAdmin && (
          <div className="bg-background border border-border rounded-[2.5rem] overflow-hidden shadow-2xl mb-8 p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Edit Profile</h3>
              <button onClick={() => setIsEditingProfile(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4 max-w-xl">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Display Name</label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mt-1"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Bio</label>
                <textarea
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mt-1 min-h-[80px]"
                  placeholder="Tell the community about yourself"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Location</label>
                <input
                  value={editLocation}
                  onChange={e => setEditLocation(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mt-1"
                  placeholder="e.g. Marrakech, Morocco"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:-translate-y-1 transition-all disabled:opacity-50"
                >
                  {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold bg-muted text-muted-foreground hover:bg-muted/80 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Recipes', value: isAdmin ? staticRecipes.length : userRecipes.length, icon: ChefHat, color: 'text-emerald-500' },
            { label: 'Likes Received', value: userRecipes.reduce((acc, r) => acc + r.likes_count, 0), icon: Heart, color: 'text-red-500' },
            { label: 'Comments', value: userRecipes.reduce((acc, r) => acc + r.comments_count, 0), icon: MessageCircle, color: 'text-blue-500' },
            { label: 'Role', value: isAdmin ? 'Admin' : 'Member', icon: User, color: 'text-purple-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-background border border-border rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className={cn("w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-3", stat.color.replace('text', 'bg').replace('500', '500/10'))}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <p className="text-2xl font-black text-foreground">{stat.value}</p>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-primary" /> {isAdmin ? 'All Recipes' : 'My Shared Recipes'}
            </h2>
          </div>

          {isAdmin ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {adminPaginatedRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    onClick={() => handleRecipeClick(String(recipe.id))}
                    className="bg-background border border-border rounded-2xl overflow-hidden group hover:shadow-xl hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  >
                    <div className="w-full aspect-[4/3] relative overflow-hidden">
                      <img
                        src={getRecipeImage(recipe)}
                        alt={recipe.title?.en}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {recipe.title?.en || recipe.title?.fr}
                      </h3>
                      {recipe.nutrition?.proteins_g > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-1">{recipe.nutrition.proteins_g}g protein</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {totalAdminPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <button
                    onClick={() => setAdminPage(p => Math.max(0, p - 1))}
                    disabled={adminPage === 0}
                    className="p-2 rounded-xl border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-muted-foreground">
                    Page {adminPage + 1} of {totalAdminPages}
                  </span>
                  <button
                    onClick={() => setAdminPage(p => Math.min(totalAdminPages - 1, p + 1))}
                    disabled={adminPage >= totalAdminPages - 1}
                    className="p-2 rounded-xl border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : userRecipes.length === 0 ? (
            <div className="bg-muted/30 border-2 border-dashed border-border rounded-3xl p-12 text-center">
              <ChefHat className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-bold mb-1">No recipes shared yet</h3>
              <p className="text-sm text-muted-foreground mb-6">Share your first traditional recipe with the community!</p>
              <button 
                onClick={() => setIsRecipeModalOpen(true)}
                className="bg-primary text-primary-foreground px-8 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:-translate-y-1 transition-all"
              >
                Create Recipe
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {userRecipes.map(recipe => (
                <div key={recipe.id} className="bg-background border border-border rounded-3xl overflow-hidden group hover:shadow-xl transition-all relative">
                  <div className="h-40 bg-gradient-to-br from-emerald-400 to-green-600 relative flex items-center justify-center text-5xl">
                    🌿
                    <div className="absolute top-3 right-3 bg-black/20 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-widest">
                      {recipe.status}
                    </div>
                    
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                       <button 
                         onClick={() => handleRecipeClick(recipe.id)}
                         className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform"
                         title="View"
                       >
                         <ExternalLink className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={() => handleEditRecipe(recipe)}
                         className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform"
                         title="Edit"
                       >
                         <Edit2 className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={() => handleDeleteRecipe(recipe.id)}
                         className="p-3 bg-red-500 text-white rounded-full hover:scale-110 transition-transform"
                         title="Delete"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-sm mb-2 group-hover:text-primary transition-colors line-clamp-1">{recipe.title.en || recipe.title.fr}</h3>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="flex items-center gap-1 text-[10px] font-bold">
                        <Heart className="w-3 h-3" /> {recipe.likes_count}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold">
                        <MessageCircle className="w-3 h-3" /> {recipe.comments_count}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <CreateRecipeModal 
        isOpen={isRecipeModalOpen} 
        onClose={() => {
          setIsRecipeModalOpen(false);
          setRecipeToEdit(null);
        }} 
        onSuccess={loadProfileData}
        recipeToEdit={recipeToEdit}
      />
    </div>
  );
}