import {
  ageOptions,
  coachPersonalityOptions,
  communicationOptions,
  contentTypeOptions,
  dayOptions,
  depthOptions,
  frequencyOptions,
  futureIdentityOptions,
  habitAnchorOptions,
  horizonOptions,
  interestOptions,
  curiosityGoalOptions,
  professionOptions,
  weeklyHourOptions,
} from "@/components/curator-onboarding/options";
import type { CuratorStepProps } from "@/components/curator-onboarding/types";
import {
  ErrorMessage,
  OptionButton,
} from "@/components/curator-onboarding/CuratorOnboardingFields";

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

export function BasicIdentityStep({
  data,
  error,
  updateData,
}: CuratorStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-slate-700">Age</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {ageOptions.map((option) => (
            <OptionButton
              isSelected={data.identity.age === option.value}
              key={option.label}
              label={option.label}
              onClick={() =>
                updateData({
                  ...data,
                  identity: { ...data.identity, age: option.value },
                })
              }
            />
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700">Profession</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {professionOptions.map((option) => (
            <OptionButton
              isSelected={data.identity.profession === option}
              key={option}
              label={option}
              onClick={() =>
                updateData({
                  ...data,
                  identity: { ...data.identity, profession: option },
                })
              }
            />
          ))}
        </div>
      </div>
      <ErrorMessage error={error} />
    </div>
  );
}

export function InterestsStep({ data, error, updateData }: CuratorStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {interestOptions.map((option) => (
          <OptionButton
            icon={option.icon}
            isSelected={data.curiosity.interests.includes(option.label)}
            key={option.label}
            label={option.label}
            onClick={() =>
              updateData({
                ...data,
                curiosity: {
                  ...data.curiosity,
                  interests: toggleValue(data.curiosity.interests, option.label),
                },
              })
            }
          />
        ))}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700">Primary goal</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {curiosityGoalOptions.map((option) => (
            <OptionButton
              isSelected={data.curiosity.curiosityPrompt === option}
              key={option}
              label={option}
              onClick={() =>
                updateData({
                  ...data,
                  curiosity: {
                    ...data.curiosity,
                    customInterest: "",
                    curiosityPrompt: option,
                  },
                })
              }
            />
          ))}
        </div>
      </div>
      <ErrorMessage error={error} />
    </div>
  );
}

export function AspirationsStep({
  data,
  error,
  updateData,
}: CuratorStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-slate-700">Future identity</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {futureIdentityOptions.map((option) => (
            <OptionButton
              isSelected={data.aspirations.futureIdentity === option.value}
              key={option.label}
              label={option.label}
              onClick={() =>
                updateData({
                  ...data,
                  aspirations: {
                    ...data.aspirations,
                    aspiration: option.aspiration,
                    futureIdentity: option.value,
                  },
                })
              }
            />
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700">Time horizon</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          {horizonOptions.map((option) => (
            <OptionButton
              isSelected={data.aspirations.horizon === option}
              key={option}
              label={option}
              onClick={() =>
                updateData({
                  ...data,
                  aspirations: { ...data.aspirations, horizon: option },
                })
              }
            />
          ))}
        </div>
      </div>
      <ErrorMessage error={error} />
    </div>
  );
}

export function AvailabilityStep({
  data,
  error,
  updateData,
}: CuratorStepProps) {
  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-semibold text-slate-700">Weekly hours</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          {weeklyHourOptions.map((option) => (
            <OptionButton
              isSelected={data.availability.weeklyHours === option.value}
              key={option.label}
              label={option.label}
              onClick={() =>
                updateData({
                  ...data,
                  availability: {
                    ...data.availability,
                    weeklyHours: option.value,
                  },
                })
              }
            />
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700">
          Preferred time
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {dayOptions.map((option) => (
            <OptionButton
              icon={option.icon}
              isSelected={data.availability.preferredDays.includes(option.label)}
              key={option.label}
              label={option.label}
              onClick={() =>
                updateData({
                  ...data,
                  availability: {
                    ...data.availability,
                    preferredDays: [option.label],
                  },
                })
              }
            />
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700">Habit anchor</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {habitAnchorOptions.map((option) => (
            <OptionButton
              isSelected={data.availability.habitAnchor === option}
              key={option}
              label={option}
              onClick={() =>
                updateData({
                  ...data,
                  availability: {
                    ...data.availability,
                    habitAnchor: option,
                  },
                })
              }
            />
          ))}
        </div>
      </div>
      <ErrorMessage error={error} />
    </div>
  );
}

export function ContentTypesStep({
  data,
  error,
  updateData,
}: CuratorStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {contentTypeOptions.map((option) => (
          <OptionButton
            icon={option.icon}
            isSelected={data.content.types.includes(option.label)}
            key={option.label}
            label={option.label}
            onClick={() =>
              updateData({
                ...data,
                content: {
                  ...data.content,
                  types: toggleValue(data.content.types, option.label),
                },
              })
            }
          />
        ))}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700">
          Preferred depth
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {depthOptions.map((option) => (
            <OptionButton
              isSelected={data.content.depth === option}
              key={option}
              label={option}
              onClick={() =>
                updateData({
                  ...data,
                  content: { ...data.content, depth: option },
                })
              }
            />
          ))}
        </div>
      </div>
      <ErrorMessage error={error} />
    </div>
  );
}

export function CoachStyleStep({ data, error, updateData }: CuratorStepProps) {
  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-semibold text-slate-700">
          Coach personality
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {coachPersonalityOptions.map((option) => (
            <OptionButton
              icon={option.icon}
              isSelected={data.coach.personality === option.label}
              key={option.label}
              label={option.label}
              onClick={() =>
                updateData({
                  ...data,
                  coach: { ...data.coach, personality: option.label },
                })
              }
            />
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700">
          Communication style
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {communicationOptions.map((option) => (
            <OptionButton
              isSelected={data.coach.communicationStyle === option}
              key={option}
              label={option}
              onClick={() =>
                updateData({
                  ...data,
                  coach: { ...data.coach, communicationStyle: option },
                })
              }
            />
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700">
          Check-in frequency
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {frequencyOptions.map((option) => (
            <OptionButton
              isSelected={data.coach.checkInFrequency === option}
              key={option}
              label={option}
              onClick={() =>
                updateData({
                  ...data,
                  coach: { ...data.coach, checkInFrequency: option },
                })
              }
            />
          ))}
        </div>
      </div>
      <ErrorMessage error={error} />
    </div>
  );
}
