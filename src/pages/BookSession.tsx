import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Video, Clock, IndianRupee } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";


interface MentorProfile {
  id: string;
  full_name: string;
  role: string;
  bio: string;
  skills: string[];
  avatar_url: string | null;
  availability: any;
  hourly_rate: number | null;
  unavailable_dates: string[] | null;
}

const BookSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [hasExplicitAvailability, setHasExplicitAvailability] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // Default slots used when mentor hasn't set explicit availability ("generally free")
  const DEFAULT_SLOTS = [
    "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"
  ];
  useEffect(() => {
    const fetchMentor = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .eq('role', 'mentor')
        .single();

      if (error) {
        console.error('Error fetching mentor:', error);
        toast({
          title: "Error",
          description: "Failed to load mentor details",
          variant: "destructive",
        });
        navigate('/mentors');
        return;
      }

      setMentor({
        ...data,
        unavailable_dates: Array.isArray(data.unavailable_dates) ? data.unavailable_dates as string[] : null
      });
      setLoading(false);
    };

    fetchMentor();
  }, [id, navigate, toast]);

  // Get available time slots based on selected date and mentor availability
  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([]);
      setHasExplicitAvailability(false);
      return;
    }

    if (!mentor?.availability) {
      // No availability data, treat as generally free
      setAvailableSlots(DEFAULT_SLOTS);
      setHasExplicitAvailability(false);
      return;
    }

    const hasExplicit = Object.values(mentor.availability).some((arr: any) =>
      Array.isArray(arr) && arr.length > 0
    );
    setHasExplicitAvailability(hasExplicit);

    const dayName = selectedDate
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase();
    const mentorAvailability = (mentor.availability[dayName] as string[]) || [];

    // If explicit schedule exists, use that day's slots; otherwise treat mentor as generally free
    if (hasExplicit) {
      setAvailableSlots(mentorAvailability);
    } else {
      setAvailableSlots(DEFAULT_SLOTS);
    }
  }, [selectedDate, mentor]);


  const handleBookSession = async () => {
    if (isBooking) return; // Prevent double submission
    
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select both date and time for your session.",
        variant: "destructive",
      });
      return;
    }

    if (!mentor) {
      toast({
        title: "Error",
        description: "Mentor information not available.",
        variant: "destructive",
      });
      return;
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to book a session.",
        variant: "destructive",
      });
      navigate('/auth/login');
      return;
    }

    // Prevent self-booking
    if (user.id === mentor.id) {
      toast({
        title: "Invalid Booking",
        description: "You cannot book a session with yourself.",
        variant: "destructive",
      });
      return;
    }

    setIsBooking(true);

    // Combine date and time
    const [hours, minutes] = selectedTime.split(':');
    const scheduledAt = new Date(selectedDate);
    scheduledAt.setHours(parseInt(hours), parseInt(minutes));

    // Check mentor availability using database function
    const { data: isAvailable, error: availError } = await supabase
      .rpc('check_mentor_availability', {
        p_mentor_id: mentor.id,
        p_scheduled_at: scheduledAt.toISOString(),
        p_duration_minutes: 60
      });

    if (availError) {
      console.error('Error checking availability:', availError);
      setIsBooking(false);
      toast({
        title: "Error",
        description: "Failed to check mentor availability.",
        variant: "destructive",
      });
      return;
    }

    if (!isAvailable) {
      setIsBooking(false);
      toast({
        title: "Time Slot Unavailable",
        description: "This time slot is no longer available. Please select another time.",
        variant: "destructive",
      });
      return;
    }

    // Insert session into database with correct mentor_id
    const { data: sessionData, error } = await supabase
      .from("sessions")
      .insert([{
        mentee_id: user.id,
        mentor_id: mentor.id,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: 60,
        status: 'scheduled',
        topic: 'Career Mentorship Session'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error booking session:', error);
      setIsBooking(false);
      toast({
        title: "Booking Failed",
        description: "There was an error booking your session. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Get mentee profile
    const { data: menteeProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    console.log('Fetching mentor email...');
    // Get mentor email using edge function
    const { data: mentorEmailData } = await supabase.functions.invoke('get-user-email', {
      body: { userId: mentor.id }
    });

    console.log('Mentor email data:', mentorEmailData);

    // Format date and time nicely
    const formattedDate = scheduledAt.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formattedTime = scheduledAt.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Send email notifications
    try {
      if (mentorEmailData?.email) {
        console.log('Sending email to mentor:', mentorEmailData.email);
        await supabase.functions.invoke('send-email', {
          body: {
            to: mentorEmailData.email,
            subject: 'Your Career Mentorship Session Details 💼',
            type: 'session-booked',
            data: {
              userName: mentor.full_name,
              menteeName: menteeProfile?.full_name || 'A mentee',
              sessionTopic: 'Career Mentorship Session',
              sessionDate: formattedDate,
              sessionTime: formattedTime,
              duration: 60,
              sessionLink: sessionData?.meeting_url || undefined
            }
          }
        });
      }

      if (user.email) {
        console.log('Sending confirmation email to mentee:', user.email);
        await supabase.functions.invoke('send-email', {
          body: {
            to: user.email,
            subject: 'Your Career Mentorship Session Details 💼',
            type: 'session-booked',
            data: {
              userName: menteeProfile?.full_name || 'User',
              mentorName: mentor.full_name,
              sessionTopic: 'Career Mentorship Session',
              sessionDate: formattedDate,
              sessionTime: formattedTime,
              duration: 60,
              sessionLink: sessionData?.meeting_url || undefined
            }
          }
        });
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Don't block the booking if email fails
    }

    toast({
      title: "Session Booked!",
      description: "Your mentorship session has been scheduled successfully.",
    });
    
    setIsBooking(false);
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <p className="text-muted-foreground">Loading mentor details...</p>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <p className="text-muted-foreground">Mentor not found</p>
      </div>
    );
  }

  const mentorRate = mentor.hourly_rate || 2000;
  const initials = mentor.full_name.split(' ').map(n => n[0]).join('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-6 py-20">
        <Button
          variant="ghost"
          className="mb-8"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Book a Session
          </h1>
          <p className="text-muted-foreground text-lg mb-12">
            Schedule time with {mentor.full_name}
          </p>

          <div className="grid lg:grid-cols-[2fr_1fr] gap-8">
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Select Date</h3>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => {
                    // Disable past dates
                    const isPast = date < new Date(new Date().setHours(0,0,0,0));
                    if (isPast) return true;
                    
                    // Check if date is in mentor's unavailable_dates
                    if (mentor.unavailable_dates && Array.isArray(mentor.unavailable_dates)) {
                      const dateStr = date.toISOString().split('T')[0];
                      if (mentor.unavailable_dates.includes(dateStr)) {
                        return true;
                      }
                    }
                    
                    // If mentor has explicit availability, check day of week
                    if (hasExplicitAvailability) {
                      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                      const slots = (mentor.availability?.[dayName] as string[]) || [];
                      return slots.length === 0;
                    }
                    
                    // Otherwise mentor is generally free
                    return false;
                  }}
                  className="rounded-md border"
                />
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Select Time</h3>
                {!selectedDate ? (
                  <p className="text-muted-foreground text-center py-8">Please select a date first</p>
                ) : availableSlots.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Mentor is not available on {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      {hasExplicitAvailability 
                        ? `Available times for ${selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}`
                        : 'Select your preferred time'}
                    </p>
                    <div className="grid grid-cols-4 gap-3">
                      {availableSlots.map((time) => (
                        <Button
                          key={time}
                          variant={selectedTime === time ? "default" : "outline"}
                          onClick={() => setSelectedTime(time)}
                          className={selectedTime === time ? "bg-gradient-primary" : ""}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            </div>

            <Card className="p-6 h-fit sticky top-24">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-2xl bg-gradient-primary text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-2xl font-semibold text-foreground">{mentor.full_name}</h3>
                    <p className="text-muted-foreground">{mentor.role}</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Video className="h-5 w-5" />
                    <span>Video Call Session</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Clock className="h-5 w-5" />
                    <span>60 minutes</span>
                  </div>
                  <div className="flex items-center gap-3 text-foreground font-semibold text-lg">
                    <IndianRupee className="h-5 w-5" />
                    <span>₹{mentor.hourly_rate || mentorRate}</span>
                  </div>
                  {mentor.availability && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-2">Mentor availability:</p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        {Object.entries(mentor.availability).map(([day, times]) => {
                          if ((times as string[]).length > 0) {
                            return (
                              <div key={day} className="capitalize">
                                <span className="font-medium">{day}:</span> {(times as string[]).join(', ')}
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleBookSession}
                  disabled={!selectedDate || !selectedTime || isBooking}
                  className="w-full bg-gradient-primary hover:opacity-90"
                  size="lg"
                >
                  {isBooking ? "Booking..." : "Confirm Booking"}
                </Button>
              </div>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BookSession;