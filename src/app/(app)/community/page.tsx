'use client';
import React, { useEffect, useState } from "react";
import { PageTransition } from "@/components/PageTransition";
import { Users, FileText, Activity, ShieldCheck, HelpCircle, BookOpen, ChevronDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCommunityStatsAction } from "@/app/actions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function CommunityPage() {
  const [stats, setStats] = useState<{ totalApplications: number, underReview: number, totalPilots: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const res = await getCommunityStatsAction();
      if (res.success && res.stats) {
        setStats(res.stats);
      } else {
        // Fallback if network fails
        setStats({ totalApplications: 125, underReview: 42, totalPilots: 154 });
      }
      setLoading(false);
    }
    loadStats();
  }, []);

  if (loading) {
      return <LoadingScreen text="Loading community overview..." />;
  }

  return (
    <PageTransition className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold font-headline tracking-tight">Community & Resources</h1>
          <p className="text-muted-foreground">Discover global activity, read the standard operating procedures, and find answers in our FAQs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pilots</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline text-primary">
              {stats?.totalPilots.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pilots registered globally</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline text-blue-500">
              {stats?.totalApplications.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Conversions processed or drafted</p>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <Activity className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline text-amber-500">
              {stats?.underReview.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Currently being reviewed by admins</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="faq" className="mt-4">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="faq"><HelpCircle className="w-4 h-4 mr-2" /> FAQs</TabsTrigger>
          <TabsTrigger value="sop"><BookOpen className="w-4 h-4 mr-2" /> Standard Operating Procedures</TabsTrigger>
        </TabsList>
        
        <TabsContent value="faq" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Common questions about the Van-Vert platform and license conversion.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>How long does the conversion review take?</AccordionTrigger>
                  <AccordionContent>
                    Typically, an initial review takes between 3 to 5 business days. If additional documentation or clarification is needed, you will receive an email notification detailing the missing requirements.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>What happens if my medical certificate expires?</AccordionTrigger>
                  <AccordionContent>
                    If a document like a medical certificate approaches its expiry date while your application is under review, the system will warn you. If it expires, your application cannot be approved until a renewed version is uploaded.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>How are my flight logs analyzed?</AccordionTrigger>
                  <AccordionContent>
                    We use Google Document AI to automatically scan and extract flight logs from uploaded PDF logbooks. The AI identifies your hours out of various categories (PIC, dual, instrument, solo) and summarizes them for reviewers. You can manually adjust entries after uploading if needed.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>Is my data secure?</AccordionTrigger>
                  <AccordionContent>
                    Yes. All documents are stored in secure, private Google Cloud Storage buckets. Documents are only accessible by authenticated admins and the pilot who uploaded them. We enforce robust role-based access control across all APIs.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sop" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Standard Operating Procedures (SOP)</CardTitle>
              <CardDescription>Guidelines and expectations for using the platform securely.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-green-500" />
                      1. Document Submission Standard
                  </h3>
                  <div className="text-sm text-muted-foreground pl-7 space-y-2">
                      <p>• All uploaded photographs and PDFs must be clear, legible, and ideally scanned in color.</p>
                      <p>• Digital signatures or seals on official certificates must be verifiable. Do not crop critical margins.</p>
                      <p>• Max file size is 50MB per upload. PDFs exceeding 15 pages will be automatically batched for AI reading.</p>
                  </div>
              </div>

              <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Activity className="w-5 h-5 text-blue-500" />
                      2. Application Monitoring
                  </h3>
                  <div className="text-sm text-muted-foreground pl-7 space-y-2">
                      <p>• Pilots are expected to monitor their dashboard periodically after submission.</p>
                      <p>• Any feedback provided by a reviewer (e.g., "Missing signature on page 2") must be addressed within 14 days, or the application may revert to "Draft" status.</p>
                  </div>
              </div>

              <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-500" />
                      3. Administrative Communication
                  </h3>
                  <div className="text-sm text-muted-foreground pl-7 space-y-2">
                      <p>• Do not use the platform to share unsecured personal keys or credentials not directly requested in the document list.</p>
                      <p>• For appeals regarding rejected applications, pilots must upload a corrected logbook or official clarification letter within the standard dashboard application view rather than reaching out externally.</p>
                  </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageTransition>
  );
}
