"use client";
import { useState } from "react";
import { Phone, Mail, MapPin, Send, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSelector } from "react-redux";
import axios from "axios";
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
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}api/website/contact`,
        formData
      );
      if (response.data._status) {
        toast.success(response?.data?._message || "Message sent successfully");
        setIsSubmitted(true);
        setIsLoading(false);
        setFormData({ name: "", email: "", message: "" });
        setTimeout(() => setIsSubmitted(false), 3000);
      }
    } catch (error) {
      const err = error as { response?: { data?: { _message?: string } }; message?: string };
      toast.error(
        err.response?.data?._message ||
          err.message ||
          "Something went wrong"
      );
      setIsLoading(false);
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
      color: "bg-amber-100/80 border border-amber-200/50",
      bgColor: "bg-amber-50/80",
      href: `tel:${siteConfig.contact.phone}`,
      ariaLabel: "Contact us by phone",
    },
    {
      icon: Mail,
      title: "Email",
      content: siteConfig.contact.email,
      subContent: "We'll respond within 24 hours",
      color: "bg-amber-100/80 border border-amber-200/50",
      bgColor: "bg-amber-50/80",
      href: `mailto:${siteConfig.contact.email}`,
      ariaLabel: "Send us an email",
    },
    {
      icon: MapPin,
      title: "Address",
      content: siteConfig.address.street,
      subContent: getFullAddress(),
      color: "bg-amber-100/80 border border-amber-200/50",
      bgColor: "bg-amber-50/80",
      href: siteConfig.address.googleMapsUrl,
      ariaLabel: "View our location on map",
    },
  ];

  return (
    <div id="contact" className="min-h-screen bg-gray-50 overflow-hidden">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 bg-white rounded-2xl">
        <h1 className="text-4xl md:text-5xl font-medium text-gray-900 mb-4 text-center">
          Contact Us
        </h1>
        <p className="text-gray-600 text-lg mb-12 text-center">
          We're here to help. Please reach out with any questions or concerns.
          We will get back to you as soon as possible.
        </p>
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16">
          {/* Left Column - Contact Info */}
          <div className="animate-in fade-in slide-in-from-left duration-700">
            <div
              className="space-y-3"
              role="list"
              aria-label="Contact information"
            >
              {contactInfo.map((info, index) => (
                <Card
                  key={index}
                  className="transition-all duration-300 hover:shadow-md hover:-translate-y-1 border-gray-200 py-2"
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
                          className="w-6 h-6 text-amber-600"
                          aria-hidden="true"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {info.title}
                        </h3>
                        <p className="text-gray-700">{info.content}</p>
                        {info.subContent && (
                          <p className="text-sm text-gray-500 mt-1">
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
          <div className="animate-in fade-in slide-in-from-right duration-700">
            <Card className="border-gray-200 shadow-lg">
              <CardContent className="p-8">
                {isSubmitted && (
                  <Alert className="mb-6 bg-green-50 border-green-200 animate-in fade-in slide-in-from-top duration-500">
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
                    <Label htmlFor="name" className="text-gray-700 font-medium">
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
                      className="text-gray-700 font-medium"
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
                      className="text-gray-700 font-medium"
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
                    className="w-full bg-amber-500 hover:bg-amber-600 transition-all duration-300 hover:scale-[1.02] disabled:hover:scale-100"
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

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-in-from-left {
          from {
            transform: translateX(-20px);
          }
          to {
            transform: translateX(0);
          }
        }

        @keyframes slide-in-from-right {
          from {
            transform: translateX(20px);
          }
          to {
            transform: translateX(0);
          }
        }

        @keyframes slide-in-from-top {
          from {
            transform: translateY(-10px);
          }
          to {
            transform: translateY(0);
          }
        }

        .animate-in {
          animation-fill-mode: both;
        }

        .fade-in {
          animation-name: fade-in;
        }

        .slide-in-from-left {
          animation-name: slide-in-from-left, fade-in;
        }

        .slide-in-from-right {
          animation-name: slide-in-from-right, fade-in;
        }

        .slide-in-from-top {
          animation-name: slide-in-from-top, fade-in;
        }

        .duration-500 {
          animation-duration: 500ms;
        }

        .duration-700 {
          animation-duration: 700ms;
        }
      `}</style>
    </div>
  );
}
