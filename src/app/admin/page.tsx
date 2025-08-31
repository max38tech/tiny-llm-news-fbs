import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsForm } from "@/components/admin/settings-form";
import { PostsTable } from "@/components/admin/posts-table";
import { getArticles } from "@/lib/mock-data";

export default async function AdminPage() {
    const articles = await getArticles();

    return (
        <div className="p-4 md:p-8">
            <header className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-headline">
                    Admin Dashboard
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    Manage your AI news feed.
                </p>
            </header>
            <Tabs defaultValue="posts" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
                    <TabsTrigger value="posts">Manage Posts</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                <TabsContent value="posts" className="mt-6">
                    <PostsTable articles={articles} />
                </TabsContent>
                <TabsContent value="settings" className="mt-6">
                    <SettingsForm />
                </TabsContent>
            </Tabs>
        </div>
    );
}
