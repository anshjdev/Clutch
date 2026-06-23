import { useEffect, useRef } from 'react'
import { CheckinAgent } from '../agents/checkinAgent'
import { useTaskStore } from '../store/taskStore'

export const useCheckinAgent = () => {
  const agentRef    = useRef(null)
  const tasks       = useTaskStore(s => s.tasks)
  const addAlert    = useTaskStore(s => s.addAlert)
  const setAgentActive = useTaskStore(s => s.setAgentActive)

  useEffect(() => {
    // Create agent once
    if (!agentRef.current) {
      agentRef.current = new CheckinAgent((alert) => {
        addAlert(alert)
      })
    }

    const pendingTasks = tasks.filter(t => t.status !== 'done' && t.deadline)

    if (pendingTasks.length > 0) {
      agentRef.current.start(pendingTasks)
      setAgentActive(true)
    } else {
      agentRef.current.stop()
      setAgentActive(false)
    }

    return () => {
      agentRef.current?.stop()
    }
  }, [tasks])   // re-run when tasks change

  return agentRef.current
}
