import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Sparkles, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const CompleteMentorProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    bio: "",
    skills: [] as string[],
    yearsOfExperience: "",
    hourlyRate: "",
  });
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    checkProfile();
  }, []);

  const checkProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profileData) {
      navigate("/dashboard");
      return;
    }

    // Allow editing even if profile is complete
    setProfile(profileData);
    setFormData({
      bio: profileData.bio || "",
      skills: profileData.skills || [],
      yearsOfExperience: profileData.years_of_experience?.toString() || "",
      hourlyRate: profileData.hourly_rate?.toString() || "",
    });
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()],
      });
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.skills.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please add at least one skill or area of expertise.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.yearsOfExperience || !formData.hourlyRate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Calculate profile completion
    let completionPercentage = 0;
    const fields = ['bio', 'skills', 'years_of_experience', 'hourly_rate'];
    const filledFields = fields.filter(field => {
      if (field === 'bio') return formData.bio.trim() !== '';
      if (field === 'skills') return formData.skills.length > 0;
      if (field === 'years_of_experience') return formData.yearsOfExperience !== '';
      if (field === 'hourly_rate') return formData.hourlyRate !== '';
      return false;
    });
    completionPercentage = Math.round((filledFields.length / fields.length) * 100);

    const { error } = await supabase
      .from("profiles")
      .update({
        bio: formData.bio,
        skills: formData.skills,
        years_of_experience: parseInt(formData.yearsOfExperience),
        hourly_rate: parseFloat(formData.hourlyRate),
        is_mentor_profile_complete: completionPercentage === 100,
        profile_completion: completionPercentage,
      })
      .eq("id", profile.id);

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Profile Complete!",
      description: "Your mentor profile has been set up successfully.",
    });

    navigate("/dashboard");
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Sparkles className="h-12 w-12 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="text-center mb-8">
            <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
              Complete Your Mentor Profile
            </h1>
            <p className="text-muted-foreground">
              Help mentees discover you by sharing your expertise
            </p>
          </div>

          <Card className="p-8 bg-gradient-card backdrop-blur-sm border-border/40">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell mentees about yourself, your experience, and what you can help them with..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={5}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label>Areas of Expertise</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., React, UI/UX Design, Career Coaching"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                  />
                  <Button type="button" onClick={addSkill} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.skills.map((skill) => (
                      <div
                        key={skill}
                        className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="hover:text-primary/70"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Experience *</Label>
                  <Input
                    id="experience"
                    type="number"
                    placeholder="5"
                    min="0"
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rate">Hourly Rate (₹) *</Label>
                  <Input
                    id="rate"
                    type="number"
                    placeholder="1500"
                    min="0"
                    step="0.01"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/dashboard")}
                >
                  Skip for Now
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-primary hover:opacity-90"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Complete Profile"}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CompleteMentorProfile;