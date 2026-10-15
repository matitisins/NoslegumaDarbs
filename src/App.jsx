import React, { lazy, Suspense, useEffect } from "react";

import useAppController from "./hooks/useAppController";
import AppHeader from "./components/app/AppHeader";
import AppOverlays from "./components/app/AppOverlays";
import AppTopBar from "./components/app/AppTopBar";
import AppStatus from "./components/app/AppStatus";
import AppFooter from "./components/app/AppFooter";
import HomeDashboard from "./components/app/HomeDashboard";
import FavoritePlayersView from "./components/app/FavoritePlayersView";
import PlayerComparisonView from "./components/app/PlayerComparisonView";
const TeamPage = lazy(() => import("./TeamPage"));
const LeagueTables = lazy(() => import("./LeagueTables"));
const FootballAnalyticsTools = lazy(() => import("./components/FootballAnalyticsTools"));
const EuropeanCompetitions = lazy(() => import("./components/EuropeanCompetitions"));

export default function App() {
  const app = useAppController();

  // The Players tab should open directly to the two-player comparison.
  // If the category has been cleared (for example after clicking Back),
  // select the default category once the league players are loaded.
  useEffect(() => {
    if (
      app.activeView === "players" &&
      !app.loading &&
      !app.error &&
      !app.selectedCategory &&
      Array.isArray(app.leaguePlayers) &&
      app.leaguePlayers.length > 0
    ) {
      const firstCategory = (app.categories || ["STRIKERS"]).find(category =>
        app.leaguePlayers.some(player => player.category === category)
      );
      if (firstCategory) app.selectCategory(firstCategory);
    }
  }, [
    app.activeView,
    app.loading,
    app.error,
    app.selectedCategory,
    app.leaguePlayers,
    app.categories,
    app.selectCategory,
  ]);
  const isDashboardView = app.activeView === "home" || app.activeView === "players" || app.activeView === "favorite-players";
  // Keep the global league/season bar on Home and Favorites, but let the
  // Players comparison page use its own position/league/season controls.

  return (
    <div className="min-h-screen bg-[#03150F] font-sans text-slate-100">
      <AppHeader
        activeView={app.activeView}
        setActiveView={app.setActiveView}
        resetPlayers={app.resetPlayers}
        openAccount={app.openAccount}
        avatarUrl={app.avatarUrl}
        username={app.username}
        favoritesCount={app.favorites.length}
        setIsGuideOpen={app.setIsGuideOpen}
      />

      <AppOverlays
        detailsPlayer={app.detailsPlayer}
        isFavorite={app.isFavorite}
        playerProfileData={app.playerProfileData}
        playerProfileLoading={app.playerProfileLoading}
        playerProfileError={app.playerProfileError}
        toggleFavorite={app.toggleFavorite}
        addToComparison={app.addToComparison}
        setDetailsPlayer={app.setDetailsPlayer}
        closePlayerProfile={app.closePlayerProfile}
        setPlayerProfileData={app.setPlayerProfileData}
        setPlayerProfileError={app.setPlayerProfileError}
        isGuideOpen={app.isGuideOpen}
        setIsGuideOpen={app.setIsGuideOpen}
        isAccountOpen={app.isAccountOpen}
        username={app.username}
        avatarUrl={app.avatarUrl}
        tempUsername={app.tempUsername}
        tempAvatar={app.tempAvatar}
        avatarError={app.avatarError}
        setTempUsername={app.setTempUsername}
        setTempAvatar={app.setTempAvatar}
        handleFileChange={app.handleFileChange}
        saveAccount={app.saveAccount}
        setAvatarError={app.setAvatarError}
        setIsAccountOpen={app.setIsAccountOpen}
      />

      <main className={`mx-auto max-w-[1480px] px-4 pb-10 pt-5 sm:px-6 ${isDashboardView ? "" : "md:px-8"}`}>
        {app.activeView !== "players" && app.activeView !== "european-competitions" && <AppTopBar
          selectedSeason={app.selectedSeason}
          setSelectedSeason={app.setSelectedSeason}
          selectedLeague={app.selectedLeague}
          setSelectedLeague={app.setSelectedLeague}
          resetPlayers={app.resetPlayers}
          refreshData={app.refreshData}
          loading={app.loading}
        />}

        {app.activeView === "home" && <HomeDashboard
          username={app.username}
          selectedLeague={app.selectedLeague}
          setSelectedLeague={app.setSelectedLeague}
          selectedSeason={app.selectedSeason}
          setSelectedSeason={app.setSelectedSeason}
          favorites={app.favorites}
          leaguePlayers={app.leaguePlayers}
          setActiveView={app.setActiveView}
          setIsGuideOpen={app.setIsGuideOpen}
        />}

        {app.activeView === "favorite-players" && <FavoritePlayersView
          favorites={app.favorites}
          selectedLeague={app.selectedLeague}
          selectedSeason={app.selectedSeason}
          openPlayer={app.openPlayer}
          toggleFavorite={app.toggleFavorite}
          setActiveView={app.setActiveView}
        />}

        {app.activeView === "players" && <>
          <AppStatus
            activeView={app.activeView}
            loading={app.loading}
            error={app.error}
            leagueName={app.leagueName}
            selectedSeason={app.selectedSeason}
            loadPlayers={app.loadPlayers}
          />
          {!app.loading && !app.error && <PlayerComparisonView
            selectedCategory={app.selectedCategory}
            setSelectedCategory={app.setSelectedCategory}
            selectedLeague={app.selectedLeague}
            setSelectedLeague={app.setSelectedLeague}
            selectedSeason={app.selectedSeason}
            setSelectedSeason={app.setSelectedSeason}
            player1={app.player1}
            player2={app.player2}
            categoryPlayers={app.categoryPlayers}
            captureRef={app.captureRef}
            takeScreenshot={app.takeScreenshot}
            openPlayer={app.openPlayer}
            setPlayer1={app.setPlayer1}
            setPlayer2={app.setPlayer2}
            selectComparisonPlayer={app.selectComparisonPlayer}
            isFavorite={app.isFavorite}
            toggleFavorite={app.toggleFavorite}
            handlePlayer1Change={app.handlePlayer1Change}
            handlePlayer2Change={app.handlePlayer2Change}
            resetPlayers={app.resetPlayers}
            fdr1={app.fdr1}
            fdr2={app.fdr2}
            fdrLoading={app.fdrLoading}
          />}
        </>}

        <Suspense fallback={<div role="status" className="rounded-2xl border border-emerald-900 bg-[#061B14] p-10 text-center text-slate-300"><div className="mx-auto h-10 w-10 animate-spin rounded-xl border-4 border-emerald-100 border-t-emerald-500"/><p className="mt-4 text-sm font-bold">Ielādē sadaļu...</p></div>}>
          {app.activeView === "teams" && <TeamPage competition={app.selectedLeague} season={app.apiSeason} leagueName={app.leagueName}/>}
          {app.activeView === "league-tables" && <LeagueTables competition={app.selectedLeague} season={app.apiSeason} leagueName={app.leagueName}/>}
          {app.activeView === "european-competitions" && <EuropeanCompetitions />}
          {app.activeView === "analytics-tools" && <FootballAnalyticsTools competition={app.selectedLeague} season={app.apiSeason} leagueName={app.leagueName}/>}
        </Suspense>

        {app.activeView !== "home" && <AppFooter />}
      </main>
    </div>
  );
}