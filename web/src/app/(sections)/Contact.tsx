"use client";
import { useState } from "react";
import { Phone, Mail, MapPin, Send, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSelector } from "react-redux";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { siteConfig, getFullAddress } from "@/lib/utils";

export default function ContactPage() {
  const details = useSelector((state: { auth: { details: { name?: string; email?: string } } }) => state.auth.details);
  const [formData, setFormData] = useState({
    name: details?.name || "",
    email: details?.email || "",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(
        "/api/website/contact",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );
      const data = await response.json();
      if (data._status) {
        toast.success(data?._message || "Message sent successfully");
        setIsSubmitted(true);
        setIsLoading(false);
        setFormData({ name: "", email: "", message: "" });
        setTimeout(() => setIsSubmitted(false), 3000);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err?.response?.data?.message || err?.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "Phone",
      content: siteConfig.contact.mobile,
      subContent: "Mon-Sun, 10am-10pm IST",
      color: "border border-[var(--brand-gold)]/30",
      bgColor: "bg-[var(--brand-gold)]/10",
      href: `tel:${siteConfig.contact.phone}`,
      ariaLabel: "Contact us by phone",
    },
    {
      icon: Mail,
      title: "Email",
      content: siteConfig.contact.email,
      subContent: "We'll respond within 24 hours",
      color: "border border-[var(--brand-gold)]/30",
      bgColor: "bg-[var(--brand-gold)]/10",
      href: `mailto:${siteConfig.contact.email}`,
      ariaLabel: "Send us an email",
    },
    {
      icon: MapPin,
      title: "Address",
      content: siteConfig.address.street,
      subContent: getFullAddress(),
      color: "border border-[var(--brand-gold)]/30",
      bgColor: "bg-[var(--brand-gold)]/10",
      href: siteConfig.address.googleMapsUrl,
      ariaLabel: "View our location on map",
    },
  ];

  return (
    <div id="contact" className="min-h-screen overflow-hidden bg-white">
      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
        <div className="mb-12 text-center">
          <p className="eyebrow mb-2"><span className="mr-2">✦</span>We're listening</p>
          <h1 className="display-heading text-4xl md:text-5xl">
            Contact <span className="accent-italic">us</span>
          </h1>
        </div>
        <p className="mx-auto mb-12 max-w-2xl text-center text-[13px] leading-relaxed text-[var(--brand-ink)]/55">
          Questions about a piece, an order or a gift? Send us a note and our
          team will get back to you within one working day.
        </p>
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16">
          {/* Left Column - Contact Info */}
          <div className="anim-fill-both anim-name-fade-in anim-name-slide-left anim-duration-700">
            <div
              className="space-y-3"
              role="list"
              aria-label="Contact information"
            >
              {contactInfo.map((info, index) => (
                <Card
                  key={index}
                  className="rounded-xl border border-[var(--brand-gold)]/25 bg-white py-2 shadow-none transition-all duration-300 hover:border-[var(--brand-gold)]/50"
                  style={{ animationDelay: `${index * 100}ms` }}
                  role="listitem"
                >
                  <CardContent className="p-5">
                    <a
                      href={info.href}
                      className="flex items-start gap-4 group"
                      aria-label={info.ariaLabel}
                      target={info.icon === MapPin ? "_blank" : undefined}
                      rel={
                        info.icon === MapPin ? "noopener noreferrer" : undefined
                      }
                    >
                      <div
                        className={`${info.bgColor} p-3 rounded-lg transition-transform duration-300 group-hover:scale-110`}
                      >
                        <info.icon
                          className="h-5 w-5 text-[var(--brand-gold-dark)]"
                          strokeWidth={1.6}
                          aria-hidden="true"
                        />
                      </div>
                      <div>
                        <h3 className="display-heading mb-1 text-[15px]">
                          {info.title}
                        </h3>
                        <p className="text-[12.5px] text-[var(--brand-ink)]/70">{info.content}</p>
                        {info.subContent && (
                          <p className="mt-1 text-[11px] text-[var(--brand-ink)]/45">
                            {info.subContent}
                          </p>
                        )}
                      </div>
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <div className="anim-fill-both anim-name-fade-in anim-name-slide-right anim-duration-700">
            <Card className="rounded-xl border border-[var(--brand-gold)]/25 bg-white shadow-none">
              <CardContent className="p-6 sm:p-8">
                <p className="eyebrow mb-1.5 text-[10px]"><span className="mr-1.5">✦</span>Write to us</p>
                <h2 className="display-heading mb-6 text-xl">Send a message</h2>
                {isSubmitted && (
                  <Alert className="mb-6 rounded-lg border border-[var(--brand-gold)]/40 bg-[var(--brand-gold)]/10">
                    <CheckCircle2 className="h-4 w-4 text-[var(--brand-gold-dark)]" />
                    <AlertDescription className="text-[12px] text-[var(--brand-ink)]/70">
                      Thank you! Your message has been sent successfully. We'll
                      respond within 24 hours.
                    </AlertDescription>
                  </Alert>
                )}

                <form
                  onSubmit={handleSubmit}
                  className="space-y-6"
                  aria-label="Contact form"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[10.5px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/55">
                      Your Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your name"
                      className="rounded-lg border-[var(--brand-gold)]/30 bg-white text-[var(--brand-ink)] transition-all duration-200 focus:border-[var(--brand-gold)] focus:ring-[var(--brand-gold)]/30"
                      aria-required="true"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-[10.5px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/55"
                    >
                      Your Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      className="rounded-lg border-[var(--brand-gold)]/30 bg-white text-[var(--brand-ink)] transition-all duration-200 focus:border-[var(--brand-gold)] focus:ring-[var(--brand-gold)]/30"
                      aria-required="true"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="message"
                      className="text-[10.5px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/55"
                    >
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Enter your message"
                      rows={5}
                      className="resize-none rounded-lg border-[var(--brand-gold)]/30 bg-white text-[var(--brand-ink)] transition-all duration-200 focus:border-[var(--brand-gold)] focus:ring-[var(--brand-gold)]/30"
                      aria-required="true"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="btn-gold w-full !text-[10.5px] uppercase tracking-[0.18em]"
                    aria-busy={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                          aria-hidden="true"
                        ></div>
                        Sending...
                      </span>
                    ) : (
                      "Submit"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
