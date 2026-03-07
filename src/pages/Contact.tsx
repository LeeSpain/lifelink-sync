import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import ContactChatWidget from "@/components/ContactChatWidget";
import { TermsDialog } from "@/components/legal/TermsDialog";
import { PrivacyDialog } from "@/components/legal/PrivacyDialog";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Mail, MessageCircle, Send, CheckCircle, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { sanitizeInput, isValidEmail, checkRateLimit, logSecurityEvent } from "@/utils/security";
import { PageSEO } from "@/components/PageSEO";
import SEOBreadcrumbs from '@/components/SEOBreadcrumbs';

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(20, "Message must be at least 20 characters"),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions to proceed"
  }),
});

type ContactFormData = z.infer<typeof contactSchema>;

const Contact: React.FC = () => {
  const { t } = useTranslation();
  useScrollToTop(); // Ensure page scrolls to top when navigated to
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      // Client-side rate limiting check
      if (!checkRateLimit('contact_form', 3, 60 * 60 * 1000)) {
        toast.error("Too many submissions. Please wait before submitting again.");
        logSecurityEvent('rate_limit_exceeded', { action: 'contact_form' });
        return;
      }

      // Additional client-side validation
      if (!isValidEmail(data.email)) {
        toast.error("Please enter a valid email address.");
        return;
      }

      // Sanitize inputs before sending
      const sanitizedData = {
        name: sanitizeInput(data.name, 100),
        email: data.email.toLowerCase().trim(),
        subject: sanitizeInput(data.subject, 200),
        message: sanitizeInput(data.message, 5000),
        acceptTerms: data.acceptTerms,
      };

      const sessionId = crypto.randomUUID();
      
      const { data: response, error } = await supabase.functions.invoke('contact-form', {
        body: {
          ...sanitizedData,
          sessionId,
        },
      });

      if (error) {
        throw error;
      }

      if (response?.success) {
        setIsSubmitted(true);
        reset();
        toast.success("Message sent successfully! Check your email for confirmation.");
        logSecurityEvent('contact_form_submitted', { submissionId: response.submissionId });
      } else {
        throw new Error(response?.error || 'Unknown error occurred');
      }
    } catch (error: any) {
      console.error('Contact form error:', error);
      if (error.message?.includes('Too many')) {
        toast.error("Too many submissions. Please wait before submitting again.");
        logSecurityEvent('rate_limit_server_rejection', { error: error.message });
      } else {
        toast.error(error.message || "Failed to send message. Please try again.");
        logSecurityEvent('contact_form_error', { error: error.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = `${t('contact.title')} | LifeLink Sync`;
  const description = t('contact.description');
  const canonical = "/contact";

  return (
    <div className="min-h-screen">
      <PageSEO pageType="contact" />
      <Navigation />
      <SEOBreadcrumbs />

      <main className="container mx-auto px-4 py-section pt-page-top">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">{t('contact.title')}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('contact.subtitle')}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Contact Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Send us a Message
                </CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you within 24-48 hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isSubmitted ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Message Sent Successfully!</h3>
                    <p className="text-muted-foreground mb-4">
                      Thank you for contacting us. We've sent a confirmation email to your inbox.
                    </p>
                    <Button onClick={() => setIsSubmitted(false)} variant="outline">
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">{t('contact.form.name')}</Label>
                        <Input
                          id="name"
                          {...register("name")}
                          placeholder={t('contact.form.name')}
                          className={errors.name ? "border-destructive" : ""}
                        />
                        {errors.name && (
                          <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">{t('contact.form.email')}</Label>
                        <Input
                          id="email"
                          type="email"
                          {...register("email")}
                          placeholder={t('contact.form.email')}
                          className={errors.email ? "border-destructive" : ""}
                        />
                        {errors.email && (
                          <p className="text-sm text-destructive">{errors.email.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">{t('contact.form.subject')}</Label>
                      <Input
                        id="subject"
                        {...register("subject")}
                        placeholder={t('contact.form.subject')}
                        className={errors.subject ? "border-destructive" : ""}
                      />
                      {errors.subject && (
                        <p className="text-sm text-destructive">{errors.subject.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">{t('contact.form.message')}</Label>
                      <Textarea
                        id="message"
                        {...register("message")}
                        placeholder={t('contact.form.message')}
                        rows={6}
                        className={errors.message ? "border-destructive" : ""}
                      />
                      {errors.message && (
                        <p className="text-sm text-destructive">{errors.message.message}</p>
                      )}
                    </div>

                    {/* Terms and Conditions Checkbox */}
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="acceptTerms"
                          checked={watch("acceptTerms")}
                          onCheckedChange={(checked) => setValue("acceptTerms", checked as boolean)}
                          className={errors.acceptTerms ? "border-destructive" : ""}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label
                            htmlFor="acceptTerms"
                            className="text-sm font-normal leading-relaxed cursor-pointer"
                          >
                            {t('contact.form.acceptTerms').split(' and ')[0]} {" "}
                            <button
                              type="button"
                              onClick={() => setShowTermsDialog(true)}
                              className="text-primary hover:underline font-medium"
                            >
                              {t('footer.terms')}
                            </button>{" "}
                            and{" "}
                            <button
                              type="button"
                              onClick={() => setShowPrivacyDialog(true)}
                              className="text-primary hover:underline font-medium"
                            >
                              {t('footer.privacy')}
                            </button>
                          </Label>
                        </div>
                      </div>
                      {errors.acceptTerms && (
                        <p className="text-sm text-destructive ml-6">{errors.acceptTerms.message}</p>
                      )}
                    </div>

                    <Button type="submit" disabled={isSubmitting} className="w-full">
                      {isSubmitting ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          {t('contact.form.sending')}
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          {t('contact.form.submit')}
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Response Time Info */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-primary mb-1">Response Time</h3>
                    <p className="text-sm text-muted-foreground">
                      We typically respond within 24-48 hours during business days.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Clara AI Chat */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-0">
                <div className="h-[600px] border rounded-lg overflow-hidden">
                  <ContactChatWidget 
                    className="h-full"
                    placeholder="Hi! I'm Clara, your LifeLink Sync assistant. How can I help you today?"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Legal Dialogs */}
        <TermsDialog 
          open={showTermsDialog} 
          onOpenChange={setShowTermsDialog}
        />
        <PrivacyDialog 
          open={showPrivacyDialog} 
          onOpenChange={setShowPrivacyDialog}
        />
      </main>

      <Footer />
    </div>
  );
};

export default Contact;