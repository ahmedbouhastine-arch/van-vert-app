import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { licenseTypes } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function NewApplicationPage() {
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          Start a New Application
        </h1>
        <p className="text-muted-foreground">
          Select the type of license you are applying for.
        </p>
      </div>
      <div className="grid gap-6">
        {licenseTypes.map((license) => (
          <Card key={license.id}>
            <CardHeader>
              <CardTitle className="font-headline">{license.name}</CardTitle>
              <CardDescription>{license.description}</CardDescription>
            </CardHeader>
            <CardContent>
                {/* In a real app, this would create a new application */}
              <Link href="/applications/app1">
                <Button>
                  Start Application <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
