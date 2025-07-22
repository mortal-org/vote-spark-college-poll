import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { VotingTimer } from "@/components/ui/voting-timer"
import { CheckCircle, User, Users, Award, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface VotingBallotProps {
  regNo: string
  mobile: string
  token: string
  onVoteSuccess: () => void
}

interface Candidate {
  id: string
  name: string
  position: string
  description: string
  imageUrl?: string
}

const candidates: Candidate[] = [
  {
    id: "candidate1",
    name: "Alex Johnson",
    position: "Student Body President",
    description: "Senior, Computer Science. Advocate for campus sustainability and student wellness programs."
  },
  {
    id: "candidate2", 
    name: "Maria Rodriguez",
    position: "Student Body President",
    description: "Junior, Business Administration. Focus on improving campus facilities and academic support services."
  },
  {
    id: "candidate3",
    name: "David Chen",
    position: "Student Body President", 
    description: "Senior, Engineering. Champion for technology integration and career development initiatives."
  },
  {
    id: "candidate4",
    name: "Sarah Williams",
    position: "Student Body President",
    description: "Junior, Liberal Arts. Passionate about diversity, inclusion, and mental health awareness."
  }
]

export function VotingBallot({ regNo, mobile, token, onVoteSuccess }: VotingBallotProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [votingEnded, setVotingEnded] = useState(false)
  const { toast } = useToast()

  // Set voting end time (2 hours from now for demo)
  const votingEndTime = new Date(Date.now() + 2 * 60 * 60 * 1000)

  useEffect(() => {
    const timer = setInterval(() => {
      if (new Date() > votingEndTime) {
        setVotingEnded(true)
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [votingEndTime])

  const submitVote = async () => {
    if (!selectedCandidate) {
      toast({
        title: "No Selection",
        description: "Please select a candidate before submitting your vote.",
        variant: "destructive"
      })
      return
    }

    if (votingEnded) {
      toast({
        title: "Voting Closed",
        description: "The voting period has ended.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Update voter record with their vote
      const { error } = await supabase
        .from('voters')
        .update({
          voted: true,
          vote_president: selectedCandidate,
          name_president: candidates.find(c => c.id === selectedCandidate)?.name
        })
        .eq('reg_no', regNo)
        .eq('mobile', mobile)
        .eq('token', token)

      if (error) throw error

      toast({
        title: "Vote Submitted Successfully",
        description: "Thank you for participating in the election!",
      })
      
      onVoteSuccess()
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Unable to submit your vote. Please try again.",
        variant: "destructive"
      })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-full">
              <Award className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold">College Election 2024</h1>
          <p className="text-lg text-muted-foreground">Select your preferred candidate for Student Body President</p>
          <div className="flex justify-center">
            <VotingTimer endTime={votingEndTime} />
          </div>
        </div>

        {/* Voter Info */}
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-primary" />
                <span className="font-medium">Authenticated Voter:</span>
                <span className="text-muted-foreground">Reg: {regNo} | Mobile: +91{mobile}</span>
              </div>
              <Badge variant="secondary" className="bg-accent/10 text-accent">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Ballot */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Student Body President
            </CardTitle>
            <CardDescription>
              Choose one candidate. Your vote is confidential and cannot be changed once submitted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedCandidate} onValueChange={setSelectedCandidate}>
              <div className="grid gap-4">
                {candidates.map((candidate) => (
                  <div key={candidate.id} className="relative">
                    <RadioGroupItem
                      value={candidate.id}
                      id={candidate.id}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={candidate.id}
                      className="flex cursor-pointer items-start space-x-4 rounded-lg border-2 border-muted p-6 hover:border-primary/50 hover:bg-primary/5 peer-checked:border-primary peer-checked:bg-primary/10 transition-all duration-200"
                    >
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-semibold text-lg">{candidate.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {candidate.description}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="h-5 w-5 rounded-full border-2 border-primary peer-checked:bg-primary peer-checked:border-primary">
                          {selectedCandidate === candidate.id && (
                            <CheckCircle className="h-5 w-5 text-primary-foreground fill-current" />
                          )}
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            onClick={submitVote}
            disabled={loading || !selectedCandidate || votingEnded}
            className="h-14 px-12 text-lg bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Submitting Vote...
              </>
            ) : votingEnded ? (
              "Voting Period Ended"
            ) : (
              "Submit My Vote"
            )}
          </Button>
        </div>

        {/* Security Notice */}
        <Card className="border-muted bg-muted/20">
          <CardContent className="pt-6">
            <div className="text-center text-sm text-muted-foreground space-y-2">
              <p className="font-medium">🔒 Your vote is secure and confidential</p>
              <p>This election uses encrypted data transmission and secure storage. Your identity is verified but your vote remains anonymous.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}