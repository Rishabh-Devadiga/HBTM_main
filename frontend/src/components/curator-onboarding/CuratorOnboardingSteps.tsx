import {
  coachPersonalityOptions,
  communicationOptions,
  contentTypeOptions,
  dayOptions,
  depthOptions,
  frequencyOptions,
  horizonOptions,
  interestOptions,
} from "@/components/curator-onboarding/options";
import type { CuratorStepProps } from "@/components/curator-onboarding/types";
import {
  ErrorMessage,
  OptionButton,
  TextAreaField,
  TextField,
} from "@/components/curator-onboarding/CuratorOnboardingFields";
import { cn } from "@/utils/cn";

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
      <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
        <TextField
          autoComplete="name"
          label="Name"
          onChange={(event) =>
            updateData({
              ...data,
              identity: { ...data.identity, name: event.target.value },
            })
          }
          placeholder="Riya"
          value={data.identity.name}
        />
        <TextField
          inputMode="numeric"
          label="Age"
          max={100}
          min={13}
          onChange={(event) =>
            updateData({
              ...data,
              identity: { ...data.identity, age: event.target.value },
            })
          }
          placeholder="24"
          type="number"
          value={data.identity.age}
        />
      </div>
      <TextField
        autoComplete="organization-title"
        label="Profession"
        onChange={(event) =>
          updateData({
            ...data,
            identity: { ...data.identity, profession: event.target.value },
          })
        }
        placeholder="Designer, student, founder, analyst..."
        value={data.identity.profession}
      />
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
      <TextField
        label="Add your own"
        onChange={(event) =>
          updateData({
            ...data,
            curiosity: {
              ...data.curiosity,
              customInterest: event.target.value,
            },
          })
        }
        placeholder="Something specific you want Curator to know"
        value={data.curiosity.customInterest}
      />
      <TextAreaField
        label="What are you curious about right now?"
        onChange={(event) =>
          updateData({
            ...data,
            curiosity: {
              ...data.curiosity,
              curiosityPrompt: event.target.value,
            },
          })
        }
        placeholder="I keep wondering how to..."
        value={data.curiosity.curiosityPrompt}
      />
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
      <TextAreaField
        label="Future identity"
        onChange={(event) =>
          updateData({
            ...data,
            aspirations: {
              ...data.aspirations,
              futureIdentity: event.target.value,
            },
          })
        }
        placeholder="I want to become someone who..."
        value={data.aspirations.futureIdentity}
      />
      <TextAreaField
        label="Aspiration"
        onChange={(event) =>
          updateData({
            ...data,
            aspirations: { ...data.aspirations, aspiration: event.target.value },
          })
        }
        placeholder="A meaningful outcome I want to move toward is..."
        value={data.aspirations.aspiration}
      />
      <div>
        <p className="text-sm font-semibold text-slate-300">Time horizon</p>
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
  const progress = ((data.availability.weeklyHours - 1) / 19) * 100;

  return (
    <div className="space-y-7">
      <label className="block">
        <span className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-300">
          Weekly availability
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">
            {data.availability.weeklyHours}h
          </span>
        </span>
        <input
          aria-label="Weekly availability"
          className="onboarding-range mt-4 w-full"
          max={20}
          min={1}
          onChange={(event) =>
            updateData({
              ...data,
              availability: {
                ...data.availability,
                weeklyHours: Number(event.target.value),
              },
            })
          }
          style={{ "--range-progress": `${progress}%` } as React.CSSProperties}
          type="range"
          value={data.availability.weeklyHours}
        />
      </label>
      <div>
        <p className="text-sm font-semibold text-slate-300">
          When should Curator fit into your week?
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
                    preferredDays: toggleValue(
                      data.availability.preferredDays,
                      option.label
                    ),
                  },
                })
              }
            />
          ))}
        </div>
      </div>
      <TextField
        label="Habit anchor"
        onChange={(event) =>
          updateData({
            ...data,
            availability: {
              ...data.availability,
              habitAnchor: event.target.value,
            },
          })
        }
        placeholder="After coffee, before lunch, Sunday evening..."
        value={data.availability.habitAnchor}
      />
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
        <p className="text-sm font-semibold text-slate-300">
          Preferred depth
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {depthOptions.map((option) => (
            <button
              className={cn(
                "min-h-12 rounded-md border px-4 text-sm font-bold transition",
                data.content.depth === option
                  ? "border-cyan-300/70 bg-cyan-300/12 text-white"
                  : "border-white/12 bg-white/7 text-slate-300 hover:bg-white/10"
              )}
              key={option}
              onClick={() =>
                updateData({
                  ...data,
                  content: { ...data.content, depth: option },
                })
              }
              type="button"
            >
              {option}
            </button>
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
        <p className="text-sm font-semibold text-slate-300">
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
        <p className="text-sm font-semibold text-slate-300">
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
        <p className="text-sm font-semibold text-slate-300">
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
