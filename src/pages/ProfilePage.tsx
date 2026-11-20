import NavBar from '@/components/NavBar';
import ProfileEditor from '@/components/ProfileEditor';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="mx-auto max-w-4xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="mb-8"><h1 className="text-3xl font-bold">Your profile</h1><p className="mt-2 text-muted-foreground">View and update your AgriWise account details.</p></div>
        <ProfileEditor />
      </main>
    </div>
  );
}
