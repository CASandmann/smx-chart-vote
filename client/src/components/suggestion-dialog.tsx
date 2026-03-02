import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function SuggestionDialog() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast({
        title: "Empty message",
        description: "Please write something before submitting.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      await apiRequest("POST", "/api/feedback", { message: message.trim() });
      toast({
        title: "Suggestion sent!",
        description: "Thanks for your feedback.",
      });
      setMessage("");
      setOpen(false);
    } catch (error) {
      toast({
        title: "Failed to send",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setMessage(""); }}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          data-testid="button-suggestion"
        >
          <MessageSquarePlus className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Make a Suggestion</DialogTitle>
          <DialogDescription>
            Share your feedback or ideas to help improve SMX Chart Voter.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Type your suggestion here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[120px]"
          data-testid="input-suggestion"
          maxLength={2000}
        />
        <p className="text-xs text-muted-foreground text-right">
          {message.length}/2000
        </p>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => { setOpen(false); setMessage(""); }}
            disabled={sending}
            data-testid="button-suggestion-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={sending || !message.trim()}
            data-testid="button-suggestion-submit"
          >
            {sending ? "Sending..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
