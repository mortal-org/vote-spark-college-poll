import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Loader2, User, Phone, Shield, Vote } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface RegMobileAuthProps {
  onAuthSuccess: (regNo: string, mobile: string, token: string) => void
}

export function RegMobileAuth({ onAuthSuccess }: RegMobileAuthProps) {
  const [step, setStep] = useState<'regNo' | 'mobile' | 'otp'>('regNo')
  const [regNo, setRegNo] = useState('')
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [sentToken, setSentToken] = useState('')
  const { toast } = useToast()

  const isValidRegNo = (regNo: string) => {
    // Basic validation for registration number (alphanumeric, min 4 chars)
    return regNo.length >= 4 && /^[a-zA-Z0-9]+$/.test(regNo)
  }

  const isValidMobile = (mobile: string) => {
    // Validate Indian mobile number format (10 digits)
    const mobileRegex = /^[6-9]\d{9}$/
    return mobileRegex.test(mobile)
  }

  const proceedToMobile = () => {
    if (!regNo) {
      toast({
        title: "Registration Number Required",
        description: "Please enter your registration number.",
        variant: "destructive"
      })
      return
    }

    if (!isValidRegNo(regNo)) {
      toast({
        title: "Invalid Registration Number",
        description: "Please enter a valid registration number (minimum 4 characters, alphanumeric).",
        variant: "destructive"
      })
      return
    }

    setStep('mobile')
  }

  const sendOTP = async () => {
    if (!mobile) {
      toast({
        title: "Mobile Number Required",
        description: "Please enter your mobile number.",
        variant: "destructive"
      })
      return
    }

    if (!isValidMobile(mobile)) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Generate a 6-digit OTP
      const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString()
      setSentToken(generatedOTP)
      
      // Check if user already voted
      const { data: existingVoter } = await supabase
        .from('voters')
        .select('voted, reg_no, mobile')
        .eq('reg_no', regNo)
        .eq('mobile', mobile)
        .single()

      if (existingVoter?.voted) {
        toast({
          title: "Already Voted",
          description: "You have already cast your vote in this election.",
          variant: "destructive"
        })
        setLoading(false)
        return
      }

      // Send OTP via SMS using edge function
      const { error: smsError } = await supabase.functions.invoke('send-otp', {
        body: {
          mobile: mobile,
          otp: generatedOTP
        }
      })

      if (smsError) {
        throw new Error('Failed to send OTP SMS')
      }
      
      toast({
        title: "OTP Sent",
        description: `Verification code sent to +91${mobile}. Check your messages.`,
      })
      
      setStep('otp')
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification code. Please try again.",
        variant: "destructive"
      })
    }
    setLoading(false)
  }

  const verifyOTP = async () => {
    if (otp !== sentToken) {
      toast({
        title: "Invalid OTP",
        description: "The verification code you entered is incorrect.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Generate a unique voting token
      const votingToken = crypto.randomUUID()
      
      // Create or update voter record
      const { error } = await supabase
        .from('voters')
        .upsert({
          reg_no: regNo,
          mobile: mobile,
          email: '', // Empty string since email is now optional
          token: votingToken,
          voted: false
        })

      if (error) throw error

      toast({
        title: "Verification Successful",
        description: "You are now authenticated to vote.",
      })
      
      onAuthSuccess(regNo, mobile, votingToken)
    } catch (error) {
      toast({
        title: "Authentication Failed",
        description: "Unable to authenticate. Please try again.",
        variant: "destructive"
      })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Vote className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">College Election 2024</CardTitle>
          <CardDescription>
            Secure voting with registration number and mobile verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 'regNo' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="regNo" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Registration Number
                </Label>
                <Input
                  id="regNo"
                  type="text"
                  placeholder="Enter your registration number"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value.toUpperCase())}
                  className="h-12"
                />
              </div>
              <Button 
                onClick={proceedToMobile}
                className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                Continue
              </Button>
            </>
          )}

          {step === 'mobile' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="mobile" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Mobile Number
                </Label>
                <div className="flex">
                  <div className="flex items-center px-3 bg-muted rounded-l-md border border-r-0">
                    <span className="text-sm text-muted-foreground">+91</span>
                  </div>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="9876543210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="h-12 rounded-l-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Button 
                  onClick={sendOTP}
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    'Send Verification Code'
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setStep('regNo')}
                  className="w-full"
                >
                  Back to Registration Number
                </Button>
              </div>
            </>
          )}

          {step === 'otp' && (
            <>
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <Shield className="h-12 w-12 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold">Enter Verification Code</h3>
                  <p className="text-sm text-muted-foreground">
                    We sent a 6-digit code to +91{mobile}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={verifyOTP}
                  disabled={loading || otp.length !== 6}
                  className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Access Ballot'
                  )}
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={() => setStep('mobile')}
                  className="w-full"
                >
                  Back to Mobile Number
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}