import { Send } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

import { Button } from "@/components/common/Button";
import { activeDomain } from "@/domain";

type MentorInputProps = {
  disabled: boolean;
  onSend: (message: string) => void;
};

export function MentorInput({ disabled, onSend }: MentorInputProps) {
  const [message, setMessage] = useState("");

  function submitMessage() {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) {
      return;
    }
    setMessage("");
    onSend(trimmedMessage);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitMessage();
    }
  }

  return (
    <div className="border-t border-slate-200 bg-white/95 px-3 py-3 backdrop-blur sm:px-5">
      <div className="flex items-end gap-3">
        <textarea
          aria-label={activeDomain.pages.mentor.inputLabel}
          className="min-h-12 max-h-36 flex-1 resize-y rounded-md border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
          disabled={disabled}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={activeDomain.pages.mentor.inputPlaceholder}
          rows={1}
          value={message}
        />
        <Button
          aria-label="Send message"
          disabled={disabled || !message.trim()}
          onClick={submitMessage}
          size="icon"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
