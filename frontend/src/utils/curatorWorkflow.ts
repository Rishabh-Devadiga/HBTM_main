import type { CuratorGrowthJourneyResponse } from "@/types/curator";
import type { LearningSessionResponse } from "@/types/learning";

export function journeyToWorkflow(
  journey: CuratorGrowthJourneyResponse
): LearningSessionResponse {
  return {
    learner_intent: {
      learning_goal: journey.decision.currentFocus,
      subject: journey.growthPlan.journey.growthTheme,
      current_skill_level: journey.growthPlan.journey.currentStage,
      available_time: journey.identityProfile.available_time,
      target_deadline: journey.estimatedCompletion,
      preferred_learning_style:
        journey.growthPlan.curationStrategy.recommendedLearningStyle,
      is_complete: true,
      missing_information: [],
      follow_up_questions: [],
    },
    learning_plan: {
      learning_goal: journey.decision.currentFocus,
      subject: journey.growthPlan.journey.growthTheme,
      learner_level: journey.growthPlan.journey.currentStage,
      total_available_time: journey.identityProfile.available_time,
      target_deadline: journey.estimatedCompletion,
      preferred_learning_style:
        journey.growthPlan.curationStrategy.recommendedLearningStyle,
      overview: journey.coachSummary,
      phases: journey.phases.map((phase) => ({
        phase_number: phase.phaseNumber,
        title: phase.title,
        objective: phase.summary,
        recommended_topics: phase.activities.map((activity) => activity.task),
        estimated_duration: phase.weekRange,
        milestones: journey.growthPlan.weeklyMilestones
          .filter((milestone) => milestone.week === phase.phaseNumber)
          .map((milestone) => milestone.outcome),
        suggested_resource_categories: phase.resources.map(
          (resource) => `${resource.resourceType}: ${resource.title}`
        ),
      })),
      final_milestone: journey.growthPlan.journey.destination,
    },
    progress_report: {
      current_phase: journey.currentPhase.phaseNumber,
      overall_completion_percentage: journey.progressPercentage,
      completed_topics: journey.phases.flatMap((phase) =>
        phase.activities
          .filter((activity) => activity.status === "completed")
          .map((activity) => activity.task)
      ),
      remaining_topics: journey.phases.flatMap((phase) =>
        phase.activities
          .filter((activity) => activity.status !== "completed")
          .map((activity) => activity.task)
      ),
      completed_milestones: [],
      next_recommended_task: journey.todayActivity.task,
      learner_status: "On Track",
      summary: journey.coachSummary,
    },
    feedback_report: {
      overall_performance_assessment: journey.growthPlan.mission.successDefinition,
      strengths: journey.identityProfile.strengths,
      areas_for_improvement: journey.identityProfile.growth_opportunities,
      personalized_study_recommendations: journey.growthPlan.habits.daily,
      motivation_message: journey.growthPlan.mission.purpose,
      next_study_session_focus: journey.todayActivity.task,
    },
    nudge_report: {
      intervention_required: false,
      learner_status: "On Track",
      nudge_type: "Study Suggestion",
      personalized_message: journey.coachSummary,
      recommended_action: journey.todayActivity.task,
      urgency: "Low",
    },
    workflow_completed: true,
    current_stage: "completed",
    error_message: null,
  };
}
