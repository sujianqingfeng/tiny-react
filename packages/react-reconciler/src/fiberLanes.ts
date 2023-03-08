import { unstable_getCurrentPriorityLevel, unstable_IdlePriority, unstable_ImmediatePriority, unstable_NormalPriority, unstable_UserBlockingPriority } from 'scheduler'
import { FiberRootNode } from './fiber'

export type Lane = number
export type Lanes = number

export const SyncLane = 0b0001
export const NoLane = 0b0000
export const NoLanes = 0b0000
export const InputContinuousLane = 0b0010
export const DefaultLane = 0b0100
export const IdleLane = 0b1000

export function mergeLanes(laneA: Lane, laneB: Lane): Lanes {
  return laneA | laneB
}

export function requestUpdateLane() {
  // 从上下文环境中获取Scheduler的优先级
  const currentSchedulerPriority = unstable_getCurrentPriorityLevel()
  const lane = schedulerPriorityToLane(currentSchedulerPriority)
  return lane
}

export function getHighestPriorityLane(lane: Lane): Lane {
  return lane & -lane
}

export function markRootFinished(root: FiberRootNode, lane: Lane) {
  root.pendingLanes &= ~lane
}

function lanesToSchedulerPriority(lanes: Lanes) {
  if (lanes === SyncLane) {
    return unstable_ImmediatePriority
  }

  if (lanes === InputContinuousLane) {
    return unstable_UserBlockingPriority
  }

  if (lanes === DefaultLane) {
    return unstable_NormalPriority
  }

  return unstable_IdlePriority
}

function schedulerPriorityToLane(schedulerPriority: number) {
  if (schedulerPriority === unstable_ImmediatePriority) {
    return SyncLane
  }

  if (schedulerPriority === unstable_UserBlockingPriority) {
    return InputContinuousLane
  }

  if (schedulerPriority === unstable_NormalPriority) {
    return DefaultLane
  }

  return IdleLane
}