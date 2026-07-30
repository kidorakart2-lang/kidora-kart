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
      color: "bg-brand-100/80 border border-brand-200/50",
      bgColor: "bg-brand-50/80",
      href: `tel:${siteConfig.contact.phone}`,
      ariaLabel: "Contact us by phone",
    },
    {
      icon: Mail,
      title: "Email",
      content: siteConfig.contact.email,
      subContent: "We'll respond within 24 hours",
      color: "bg-brand-100/80 border border-brand-200/50",
      bgColor: "bg-brand-50/80",
      href: `mailto:${siteConfig.contact.email}`,
      ariaLabel: "Send us an email",
    },
    {
      icon: MapPin,
      title: "Address",
      content: siteConfig.address.street,
      subContent: getFullAddress(),
      color: "bg-brand-100/80 border border-brand-200/50",
      bgColor: "bg-brand-50/80",
      href: siteConfig.address.googleMapsUrl,
      ariaLabel: "View our location on map",
    },
  ];

  return (
    <div id="contact" className="min-h-screen bg-muted overflow-hidden">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 bg-background rounded-2xl">
        <h1 className="text-4xl md:text-5xl font-medium text-foreground mb-4 text-center">
          Contact Us
        </h1>
        <p className="text-muted-foreground text-lg mb-12 text-center">
          We're here to help. Please reach out with any questions or concerns.
          We will get back to you as soon as possible.
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
                  className="transition-all duration-300 hover:shadow-md hover:-translate-y-1 border-border py-2"
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
                          className="w-6 h-6 text-brand-600"
                          aria-hidden="true"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">
                          {info.title}
                        </h3>
                        <p className="text-muted-foreground">{info.content}</p>
                        {info.subContent && (
                          <p className="text-sm text-muted-foreground mt-1">
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
            <Card className="border-border shadow-lg">
              <CardContent className="p-8">
                {isSubmitted && (
                  <Alert className="mb-6 bg-green-50 border-green-200 anim-fill-both anim-name-fade-in anim-name-slide-top anim-duration-500">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
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
                    <Label htmlFor="name" className="text-muted-foreground font-medium">
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
                      className="transition-all duration-200 focus:scale-[1.01]"
                      aria-required="true"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-muted-foreground font-medium"
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
                      className="transition-all duration-200 focus:scale-[1.01]"
                      aria-required="true"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="message"
                      className="text-muted-foreground font-medium"
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
                      className="resize-none transition-all duration-200 focus:scale-[1.01]"
                      aria-required="true"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    variant="gradient"
                    className="w-full"
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
