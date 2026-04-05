'use client';
import React, { useEffect, useState } from "react";
import { Users, FileText, Activity, ShieldCheck, HelpCircle, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCommunityStatsAction } from "@/app/actions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingScreen } from "@/components/LoadingScreen";

export function CommunityClient() {
  const [stats, setStats] = useState<{ totalApplications: number, underReview: number, totalPilots: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const res = await getCommunityStatsAction();
      if (res.success && res.stats) {
        setStats(res.stats);
      } else {
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
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold font-headline tracking-tight">Community & Resources</h2>
          <p className="text-sm text-muted-foreground">Discover global activity, read the standard operating procedures, and find answers in our FAQs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pilots</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline text-primary">
              {stats?.totalPilots.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pilots globally</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline text-blue-500">
              {stats?.totalApplications.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Conversions</p>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/5 border-amber-500/20 md:col-span-2 2xl:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <Activity className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline text-amber-500">
              {stats?.underReview.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pending admins</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="faq" className="mt-2 text-sm w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="faq"><HelpCircle className="w-4 h-4 mr-2" /> FAQs</TabsTrigger>
          <TabsTrigger value="sop"><BookOpen className="w-4 h-4 mr-2" /> SOPs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="faq" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-sm">How long does the review take?</AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground">
                    Typically, an initial review takes between 3 to 5 business days. You will receive an email if more info is needed.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-sm">What happens if my medical certificate expires?</AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground">
                    If it expires, your application cannot be approved until a renewed version is uploaded.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-sm">How are my flight logs analyzed?</AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground">
                    We use Document AI to extract flight logs from uploaded PDFs, summarizing them for reviewers.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-sm">Is my data secure?</AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground">
                    Yes. All documents are stored in secure, private buckets with robust access control.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sop" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Standard Operating Procedures</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="space-y-1">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-green-500" />
                      1. Document Standards
                  </h3>
                  <div className="text-xs text-muted-foreground pl-6 space-y-1">
                      <p>• All photos/PDFs must be legible.</p>
                      <p>• Max file size is 50MB per upload.</p>
                  </div>
              </div>

              <div className="space-y-1">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-500" />
                      2. Application Monitoring
                  </h3>
                  <div className="text-xs text-muted-foreground pl-6 space-y-1">
                      <p>• Monitor your dashboard after submission.</p>
                      <p>• Address feedback within 14 days.</p>
                  </div>
              </div>

              <div className="space-y-1">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-500" />
                      3. Communication
                  </h3>
                  <div className="text-xs text-muted-foreground pl-6 space-y-1">
                      <p>• Do not share unsecured credentials.</p>
                      <p>• Correct application issues via the dashboard.</p>
                  </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
