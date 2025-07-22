import React, { useState } from "react"
import { RegMobileAuth } from "@/components/voting/reg-mobile-auth"
import { VotingBallot } from "@/components/voting/voting-ballot"
import { VoteSuccess } from "@/components/voting/vote-success"

type VotingState = 'auth' | 'voting' | 'success'

const Index = () => {
  const [state, setState] = useState<VotingState>('auth')
  const [voterRegNo, setVoterRegNo] = useState('')
  const [voterMobile, setVoterMobile] = useState('')
  const [voterToken, setVoterToken] = useState('')

  const handleAuthSuccess = (regNo: string, mobile: string, token: string) => {
    setVoterRegNo(regNo)
    setVoterMobile(mobile)
    setVoterToken(token)
    setState('voting')
  }

  const handleVoteSuccess = () => {
    setState('success')
  }

  const handleReset = () => {
    setState('auth')
    setVoterRegNo('')
    setVoterMobile('')
    setVoterToken('')
  }

  return (
    <>
      {state === 'auth' && (
        <RegMobileAuth onAuthSuccess={handleAuthSuccess} />
      )}
      {state === 'voting' && (
        <VotingBallot 
          regNo={voterRegNo}
          mobile={voterMobile}
          token={voterToken}
          onVoteSuccess={handleVoteSuccess}
        />
      )}
      {state === 'success' && (
        <VoteSuccess 
          regNo={voterRegNo}
          onReset={handleReset}
        />
      )}
    </>
  )
};

export default Index;
