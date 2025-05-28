
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home, Users, User, PlusCircle, Feather, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { CreatePostDialog } from "@/components/posts/CreatePostDialog";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut as signOutAction } from "@/lib/actions/auth";


const navItems = [
  { href: "/fyp", label: "For You", icon: Home },
  { href: "/following", label: "Following", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { profile, user, loading } = useAuth();

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0,2);
  }

  if (loading && !profile) {
    return (
       <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar p-4 transition-transform">
        <div className="mb-8 flex items-center gap-2 px-2">
          <Feather className="h-8 w-8 text-sidebar-primary" />
          <h1 className="text-2xl font-bold text-sidebar-foreground">ChirpSpark</h1>
        </div>
        <div className="space-y-2">
          <div className="h-10 w-full animate-pulse rounded-md bg-sidebar-accent/50" />
          <div className="h-10 w-full animate-pulse rounded-md bg-sidebar-accent/50" />
          <div className="h-10 w-full animate-pulse rounded-md bg-sidebar-accent/50" />
        </div>
        <div className="mt-auto">
          <div className="h-10 w-full animate-pulse rounded-md bg-sidebar-accent/50" />
        </div>
       </aside>
    );
  }


  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar p-4 transition-transform">
      <div className="mb-8 flex items-center gap-2 px-2">
        <Feather className="h-8 w-8 text-sidebar-primary" />
        <h1 className="text-2xl font-bold text-sidebar-foreground">ChirpSpark</h1>
      </div>

      <nav className="flex-grow space-y-2">
        {navItems.map((item) => {
          const isActive = item.href === '/profile' ? pathname.startsWith('/profile') : pathname === item.href;
          return (
          <Button
            key={item.label}
            variant={isActive ? "default" : "ghost"}
            className={cn(
              "w-full justify-start text-base",
              isActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
            asChild
          >
            <Link href={item.href === '/profile' && profile?.username ? `/profile/${profile.username}` : item.href}>
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </Link>
          </Button>
        )})}
      </nav>

      <div className="mt-auto space-y-4">
        <CreatePostDialog trigger={
            <Button size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              <PlusCircle className="mr-2 h-5 w-5" />
              New Chirp
            </Button>
        }/>
        
        {profile && user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-2 h-auto text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                <Avatar className="h-9 w-9 mr-3">
                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.username || "User avatar"} data-ai-hint="user avatar" />
                  <AvatarFallback>{getInitials(profile.username)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="font-semibold">{profile.username || "User"}</span>
                  <span className="text-xs text-muted-foreground">{profile.email ? profile.email.split('@')[0] : ''}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2 ml-2" side="top" align="start">
              <DropdownMenuLabel>{profile.username || "My Account"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={profile.username ? `/profile/${profile.username}` : '/profile'}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              {/* Add settings link if needed */}
              {/* <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem> */}
              <DropdownMenuSeparator />
              <form action={signOutAction} className="w-full">
                <DropdownMenuItem asChild>
                    <button type="submit" className="w-full cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                    </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </aside>
  );
}
