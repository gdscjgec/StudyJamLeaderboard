"use client";

import { useState, useEffect, useCallback, useMemo, ChangeEvent } from "react";
import Image from "next/image";
import type { LeaderboardEntry, FrozenUser } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Upload, Crown, ExternalLink, Loader2, Trophy, Sun, Moon, Lock, Search, LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Home() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [frozenUsers, setFrozenUsers] = useState<Record<string, FrozenUser>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [theme, setTheme] = useState("dark");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const isMobile = useIsMobile();

  // Admin login check
  const handleAdminLogin = () => {
    const validUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME;
    const validPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    if (adminUsername === validUsername && adminPassword === validPassword) {
      setIsAdmin(true);
      setLoginOpen(false);
      setAdminUsername("");
      setAdminPassword("");
    } else {
      alert("Invalid username or password");
    }
  };

  // Admin logout
  const handleAdminLogout = () => {
    setIsAdmin(false);
  };

  // Fetch from API
  const fetchLeaderboard = useCallback(async () => {
    try {
      setDataLoading(true);
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const { entries, frozenUsers: frozen } = await res.json();
        console.log('API Response:', { entries, frozen });
        setLeaderboardData(entries || []);
        setFrozenUsers(frozen || {});
      } else {
        console.error('API Error:', await res.text());
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log('📤 Frontend: Uploading file:', file.name);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      let data;
      if (res.ok) {
        data = await res.json();
        await fetchLeaderboard();
        alert(data.message || 'Leaderboard updated successfully!');
      } else {
        const text = await res.text();
        console.error('❌ API Response (non-JSON):', text.substring(0, 200));
        const errorMsg = text.includes('<!DOCTYPE') ? 'Server error - check console' : (await res.json().catch(() => ({})) as any).error || 'Upload failed';
        alert(errorMsg);
      }
    } catch (error: any) {
      console.error('💥 Frontend Upload error:', error);
      alert('Upload failed: ' + (error.message || 'Network error'));
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Trophy className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Trophy className="h-5 w-5 text-yellow-700" />;
    return rank;
  };

  const filteredLeaderboardData = useMemo(() => {
    const data = Array.isArray(leaderboardData) ? [...leaderboardData] : [];
    return data.filter((user) =>
      user['User Name']?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user['User Email']?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [leaderboardData, searchQuery]);

  if (dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <main className={`flex flex-1 flex-col gap-4 ${isMobile ? "p-2" : "p-4 md:gap-8 md:p-10"}`}>
          <header className={`flex flex-col gap-2 ${isMobile ? "mb-2" : "mb-4"}`}>
            <div className={`flex ${isMobile ? "flex-col items-center gap-2" : "flex-row items-center justify-between gap-4"}`}>
              <div className={`flex ${isMobile ? "flex-col items-center gap-2" : "flex-row items-center gap-4"}`}>
                <Image
                  src="/GDGoC JGEC Logo.png"
                  alt="GDG JGEC Logo"
                  width={isMobile ? 56 : 72}
                  height={isMobile ? 56 : 72}
                  className="rounded-full shadow"
                />
                <div className={isMobile ? "text-center" : ""}>
                  <h1 className={`font-headline font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent ${isMobile ? "text-2xl" : "text-4xl xl:text-5xl"}`}>
                    JGEC Study Jam Leaderboard
                  </h1>
                  <p className={`max-w-[700px] text-foreground/80 ${isMobile ? "text-sm mt-1" : "text-base md:text-lg"}`}>
                    Google Study Jam 2025-26 progress for Jalpaiguri Government Engineering College.
                  </p>
                </div>
              </div>
              <div className={`flex items-center gap-2 ${isMobile ? "mt-3 justify-center" : "self-end"}`}>
                {!isAdmin && (
                  <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setLoginOpen(true)}>
                        Login
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Admin Login</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Username"
                          value={adminUsername}
                          onChange={(e) => setAdminUsername(e.target.value)}
                        />
                        <Input
                          type="password"
                          placeholder="Password"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                        />
                        <Button onClick={handleAdminLogin}>Login</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                {isAdmin && (
                  <Button variant="outline" size="sm" onClick={handleAdminLogout}>
                    <LogOut className="h-4 w-4 mr-2" /> Logout
                  </Button>
                )}
                <Button variant="outline" size="icon" onClick={toggleTheme}>
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </div>
            </div>
            <div className="border-b border-muted/40 mt-2" />
          </header>

          {isAdmin && (
            <Card>
              <CardHeader className={`flex ${isMobile ? "flex-col gap-2" : "flex-col sm:flex-row items-start sm:items-center justify-between gap-4"}`}>
                <div>
                  <CardTitle>Admin Controls</CardTitle>
                  <CardDescription>Upload new leaderboard data.</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto">
                  <div className="grid w-full items-center gap-1.5 flex-grow">
                    <Label htmlFor="csv-upload" className="sr-only">Upload CSV</Label>
                    <Input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      disabled={isLoading}
                      className="hidden"
                    />
                    <Button asChild variant="default" size="sm" className="gap-1" disabled={isLoading}>
                      <Label htmlFor="csv-upload" className="cursor-pointer w-full text-center">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        <span className="hidden sm:inline">{isLoading ? "Processing..." : "Upload CSV"}</span>
                        <span className="sm:hidden">{isLoading ? "Processing..." : "Upload"}</span>
                      </Label>
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}

          <Card>
            <CardHeader className={`flex ${isMobile ? "flex-col gap-2" : "flex-row items-center justify-between"}`}>
              <CardTitle>Current Standings</CardTitle>
              <div className="relative w-full sm:w-auto max-w-[300px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name or email..."
                  className="pl-8 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                <div className="flex flex-col gap-2">
                  {filteredLeaderboardData.length > 0 ? (
                    filteredLeaderboardData.map((user, index) => {
                      const safeKey = user['User Email'] || `${user['User Name'] || 'unknown'}-${index}`;
                      const isFrozen = frozenUsers[user['User Email']] || user['All Skill Badges & Games Completed'] === 'Yes';
                      const displayRank = isFrozen && frozenUsers[user['User Email']] ? frozenUsers[user['User Email']].rank : user.rank;
                      return (
                        <Card key={safeKey} className={isFrozen ? "bg-green-100 dark:bg-green-900/30" : ""}>
                          <CardHeader className="flex flex-row items-center gap-2">
                            <div className="font-bold text-lg flex items-center gap-2">
                              {getRankBadge(displayRank)}
                              {isFrozen && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Lock className="h-4 w-4 text-green-600" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>This user's rank is locked as they completed all tasks on rank {displayRank}.</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{user['User Name']}</div>
                              <div className="text-sm text-muted-foreground">{user['User Email']}</div>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  asChild
                                  variant="ghost"
                                  size="icon"
                                  disabled={!user['Google Cloud Skills Boost Profile URL']}
                                >
                                  <a
                                    href={user['Google Cloud Skills Boost Profile URL']}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View Google Cloud Skills Boost Profile</p>
                              </TooltipContent>
                            </Tooltip>
                          </CardHeader>
                          <CardContent className="flex flex-row gap-4 text-sm">
                            <div>
                              <span className="font-semibold">Skill Badges:</span> {user['# of Skill Badges Completed']}
                            </div>
                            <div>
                              <span className="font-semibold">Arcade Games:</span> {user['# of Arcade Games Completed']}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      {searchQuery ? "No users found." : "No data available. Please upload a CSV file to begin."}
                    </div>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className={isMobile ? "sticky top-0 bg-muted z-10" : ""}>
                      <TableRow>
                        <TableHead className="w-[70px] text-center">Rank</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead className="text-center">Skill Badges</TableHead>
                        {!isMobile && (
                          <TableHead className="text-center hidden sm:table-cell">Arcade Games</TableHead>
                        )}
                        <TableHead className="text-center">Profile</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeaderboardData.length > 0 ? (
                        filteredLeaderboardData.map((user, index) => {
                          const safeKey = user['User Email'] || `${user['User Name'] || 'unknown'}-${index}`;
                          const isFrozen = frozenUsers[user['User Email']] || user['All Skill Badges & Games Completed'] === 'Yes';
                          const displayRank = isFrozen && frozenUsers[user['User Email']] ? frozenUsers[user['User Email']].rank : user.rank;
                          return (
                            <TableRow
                              key={safeKey}
                              className={isFrozen ? "bg-green-100 dark:bg-green-900/30" : ""}
                            >
                              <TableCell className="font-bold text-center text-lg">
                                <div className="flex items-center justify-center gap-2">
                                  {getRankBadge(displayRank)}
                                  {isFrozen && (
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Lock className="h-4 w-4 text-green-600" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>This user's rank is locked as they completed all tasks on rank {displayRank}.</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{user['User Name']}</div>
                                <div className="hidden text-sm text-muted-foreground sm:inline">
                                  {user['User Email']}
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-mono text-base">
                                {user['# of Skill Badges Completed']}
                              </TableCell>
                              {!isMobile && (
                                <TableCell className="text-center font-mono text-base hidden sm:table-cell">
                                  {user['# of Arcade Games Completed']}
                                </TableCell>
                              )}
                              <TableCell className="text-center">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      asChild
                                      variant="ghost"
                                      size="icon"
                                      disabled={!user['Google Cloud Skills Boost Profile URL']}
                                    >
                                      <a
                                        href={user['Google Cloud Skills Boost Profile URL']}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </a>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>View Google Cloud Skills Boost Profile</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={isMobile ? 4 : 5} className="h-24 text-center">
                            {searchQuery ? "No users found." : "No data available. Please upload a CSV file to begin."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </TooltipProvider>
  );
}