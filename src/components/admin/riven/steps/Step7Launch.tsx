import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rocket, Loader2, CheckCircle2, PartyPopper } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { RivenSpeech } from "../RivenSpeech";

interface Step7LaunchProps {
  campaignTitle: string;
  startDate: string;
  totalPosts: number;
  enabledPlatforms: string[];
  duration: number;
  generating: boolean;
  progress: number;
  onSetTitle: (title: string) => void;
  onSetStartDate: (date: string) => void;
  onLaunch: () => void;
  launchComplete: boolean;
}

export function Step7Launch({
  campaignTitle,
  startDate,
  totalPosts,
  enabledPlatforms,
  duration,
  generating,
  progress,
  onSetTitle,
  onSetStartDate,
  onLaunch,
  launchComplete,
}: Step7LaunchProps) {
  if (launchComplete) {
    return (
      <div className="space-y-6 text-center py-8">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-green-500/10">
            <PartyPopper className="h-12 w-12 text-green-500" />
          </div>
        </div>
        <div>
          <h2 className="text-base font-semibold">
            {duration === 1 ? "Post Created!" : "Campaign Launched!"}
          </h2>
          <p className="text-muted-foreground mt-1">
            {totalPosts} {totalPosts === 1 ? "post" : "posts"} generated across {enabledPlatforms.length} {enabledPlatforms.length === 1 ? "platform" : "platforms"}
          </p>
        </div>
        <RivenSpeech text="Your campaign is live! Head to the dashboard to monitor progress and manage your content calendar." />
      </div>
    );
  }

  if (generating) {
    return (
      <div className="space-y-6 text-center py-8">
        <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
        <div>
          <h2 className="text-lg font-bold">
            {duration === 1 ? "Riven is writing your post..." : "Riven is generating your content..."}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Creating {totalPosts} unique {totalPosts === 1 ? "post" : "posts"}
          </p>
        </div>
        <div className="max-w-md mx-auto">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">{Math.round(progress)}% complete</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RivenSpeech text="Everything looks great. Review the summary and launch when you're ready!" />

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Campaign Summary</h3>

        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Campaign Title</Label>
            <Input
              value={campaignTitle}
              onChange={(e) => onSetTitle(e.target.value)}
              placeholder="My LifeLink Campaign"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => onSetStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Duration</Label>
              <p className="text-sm font-medium mt-2">
                {duration === 1 ? "Single Post" : `${duration} days`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 py-3 border-y">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{totalPosts}</p>
              <p className="text-xs text-muted-foreground">Total Posts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{enabledPlatforms.length}</p>
              <p className="text-xs text-muted-foreground">Platforms</p>
            </div>
            <div className="text-center">
              {duration === 1 ? (
                <>
                  <p className="text-2xl font-bold">1</p>
                  <p className="text-xs text-muted-foreground">Post</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold">{duration}</p>
                  <p className="text-xs text-muted-foreground">Days</p>
                </>
              )}
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Platforms</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {enabledPlatforms.map((p) => (
                <span
                  key={p}
                  className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full capitalize"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-center">
        <Button size="lg" onClick={onLaunch} className="gap-2">
          <Rocket className="h-4 w-4" />
          Launch Campaign
        </Button>
      </div>
    </div>
  );
}
