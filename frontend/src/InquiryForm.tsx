import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "./api";
const inquirySchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(7, "Enter a phone number"),
  message: z.string().min(5, "Tell us a little more"),
  date: z.string().optional(),
  guests: z.coerce.number().optional(),
  website: z.string().optional(),
});
export default function InquiryForm({
  kind,
}: {
  kind: "contact" | "catering";
}) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof inquirySchema>>({
    resolver: zodResolver(inquirySchema),
  });
  if (sent)
    return (
      <div className="form-panel form-success" role="status">
        <span>✓</span>
        <h2>Thank you for reaching out.</h2>
        <p>
          Your message is with our team. For anything urgent, please give us a
          call.
        </p>
        <button onClick={() => setSent(false)}>Send another message</button>
      </div>
    );
  return (
    <form
      className="inquiry-form form-panel"
      onSubmit={handleSubmit(async (values) => {
        setError("");
        if (
          kind === "catering" &&
          (!values.date || !values.guests || values.guests < 1)
        ) {
          setError("Please enter your event date and guest count.");
          return;
        }
        try {
          await api("/inquiries", "POST", { ...values, kind });
          setSent(true);
        } catch (e) {
          setError((e as Error).message);
        }
      })}
    >
      <h2>
        {kind === "catering" ? "Let’s plan something delicious." : "Say hello."}
      </h2>
      <div className="form-grid">
        {(
          [
            "name",
            "email",
            "phone",
            ...(kind === "catering" ? ["date", "guests"] : []),
          ] as const
        ).map((key) => (
          <label key={key}>
            {key === "guests"
              ? "Number of guests"
              : key.charAt(0).toUpperCase() + key.slice(1)}
            <input
              {...register(key as keyof z.infer<typeof inquirySchema>)}
              type={
                key === "email"
                  ? "email"
                  : key === "date"
                    ? "date"
                    : key === "guests"
                      ? "number"
                      : key === "phone"
                        ? "tel"
                        : "text"
              }
              min={key === "guests" ? 1 : undefined}
              required
            />
            {errors[key as keyof typeof errors] && (
              <span className="error">
                {errors[key as keyof typeof errors]?.message}
              </span>
            )}
          </label>
        ))}
      </div>
      <label>
        Your message
        <textarea rows={4} {...register("message")} required />
        {errors.message && (
          <span className="error">{errors.message.message}</span>
        )}
      </label>
      <div className="honeypot" aria-hidden="true">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" {...register("website")} />
        </label>
      </div>
      <p className="error" role="alert">
        {error}
      </p>
      <button className="button" disabled={isSubmitting}>
        {isSubmitting
          ? "Sending…"
          : kind === "catering"
            ? "Send catering inquiry"
            : "Send message"}
      </button>
      <small>We’ll use your details only to respond to your inquiry.</small>
    </form>
  );
}
