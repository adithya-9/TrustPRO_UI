import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, BadgeCheck, Camera, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, errorMessage } from "../../api/client";
import { candidateApi } from "../../api/endpoints";
import { AppShell } from "../../components/layout/AppShell";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader } from "../../components/ui/Card";
import { Field, Input } from "../../components/ui/Field";
import { Steps } from "../../components/ui/Progress";
import { PageLoader } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/Toast";
import { ME_KEY } from "../../hooks/useAuth";
import { PhotoInput } from "./PhotoInput";

type Fields = "first_name" | "last_name" | "date_of_birth" | "mobile_number" | "city" | "profile_photo";

export default function ProfilePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const profile = useQuery({ queryKey: ["profile"], queryFn: candidateApi.profile });

  const [form, setForm] = useState({ first_name: "", last_name: "", date_of_birth: "", mobile_number: "", city: "" });
  const [photo, setPhoto] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<Record<Fields, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const p = profile.data;
    if (!p) return;
    setForm({
      first_name: p.first_name ?? "", last_name: p.last_name ?? "", date_of_birth: p.date_of_birth ?? "",
      mobile_number: p.mobile_number ?? "", city: p.city ?? "",
    });
  }, [profile.data]);

  if (profile.isPending) return <AppShell><PageLoader label="Loading your profile" /></AppShell>;
  if (profile.isError) {
    return <AppShell><Alert tone="danger" title="Your profile could not be loaded">{errorMessage(profile.error)}</Alert></AppShell>;
  }
  const existing = profile.data;

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => (er[field] ? { ...er, [field]: "" } : er));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const v: Partial<Record<Fields, string>> = {};
    if (!form.first_name.trim()) v.first_name = "Enter your first name.";
    if (!form.last_name.trim()) v.last_name = "Enter your last name.";
    if (!form.date_of_birth) v.date_of_birth = "Enter your date of birth.";
    if (!/^\+?[0-9\s-]{10,18}$/.test(form.mobile_number.trim())) v.mobile_number = "Enter a valid mobile number.";
    if (!photo && !existing.profile_photo_url) v.profile_photo = "A profile photo is required.";
    else if (errors.profile_photo && photo) v.profile_photo = errors.profile_photo;
    setErrors(v);
    if (Object.values(v).some(Boolean)) return;

    const data = new FormData();
    Object.entries(form).forEach(([k, val]) => { if (val.trim()) data.append(k, val.trim()); });
    if (photo) data.append("profile_photo", photo);

    setSaving(true);
    try {
      const saved = await candidateApi.saveProfile(data);
      qc.setQueryData(["profile"], saved);
      await qc.invalidateQueries({ queryKey: ME_KEY });
      toast.success("Profile saved", "Next, show your government ID on camera.");
      navigate("/onboarding/id-verification");
    } catch (err) {
      if (err instanceof ApiError) {
        if (Object.keys(err.fields).length) setErrors(err.fields as Partial<Record<Fields, string>>);
        else if (err.code.startsWith("PROFILE_PHOTO")) setErrors({ profile_photo: err.message });
        else setFormError(err.message);
      } else setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const text = (field: keyof typeof form, label: string, props: React.InputHTMLAttributes<HTMLInputElement>, hint?: string) => (
    <Field label={label} error={errors[field] || undefined} hint={hint}>
      {(id, d) => <Input id={id} aria-describedby={d} value={form[field]} onChange={set(field)} invalid={!!errors[field]} {...props} />}
    </Field>
  );

  return (
    <AppShell>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Candidate profile</h1>
          <p className="mt-1 text-ink-500">A few basic details and a photo of you.</p>
        </div>
        <Steps steps={["Profile", "ID verification", "Interview"]} current={0} />
      </div>

      <form onSubmit={submit} noValidate className="mt-8 grid items-start gap-6 lg:grid-cols-[1.15fr_1fr]">
        <Card>
          <CardHeader icon={<UserRound className="size-5" />} title="Personal details" description="Only what is needed for your interview." />
          <div className="grid gap-5 p-6 sm:grid-cols-2">
            {text("first_name", "First name", { autoComplete: "given-name", placeholder: "e.g. Eswaradithya", maxLength: 75 })}
            {text("last_name", "Last name", { autoComplete: "family-name", placeholder: "e.g. Palla", maxLength: 75 })}
            {text("date_of_birth", "Date of birth", { type: "date", max: new Date().toISOString().slice(0, 10) })}
            {text("mobile_number", "Mobile number", { type: "tel", autoComplete: "tel", placeholder: "e.g. 9876543210", maxLength: 18 })}
            <div className="sm:col-span-2">
              {text("city", "City", { autoComplete: "address-level2", placeholder: "e.g. Hyderabad", maxLength: 100 }, "Optional")}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader icon={<Camera className="size-5" />} title="Profile photo" description="Required to continue." />
          <div className="p-6">
            <PhotoInput label="Profile photo" description="A clear, front-facing photo of only you. JPEG, PNG or WebP, up to 8 MB."
              icon={<UserRound className="size-5" />} existingUrl={existing.profile_photo_url} file={photo} allowCamera
              onChange={(f, err) => { setPhoto(f); setErrors((e) => ({ ...e, profile_photo: err ?? "" })); }}
              error={errors.profile_photo || undefined} />
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-ink-50 p-4 text-[13px] text-ink-600">
              <BadgeCheck className="mt-0.5 size-4 shrink-0 text-teal-600" />
              We check that the photo shows one clear face before saving.
            </p>
          </div>
        </Card>

        <div className="flex flex-col-reverse items-stretch gap-4 lg:col-span-2 sm:flex-row sm:items-center sm:justify-between">
          {formError ? <Alert tone="danger" className="flex-1">{formError}</Alert> : <span />}
          <Button type="submit" size="lg" loading={saving} trailingIcon={<ArrowRight className="size-4" />}>
            {saving ? "Checking photo…" : "Save and continue"}
          </Button>
        </div>
      </form>
    </AppShell>
  );
}
