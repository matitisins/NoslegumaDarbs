import React from "react";

import useAppController from "./hooks/useAppController";
import AppHeader from "./components/app/AppHeader";
import AppOverlays from "./components/app/AppOverlays";
import AppTopBar from "./components/app/AppTopBar";
import AppStatus from "./components/app/AppStatus";
import AppFooter from "./components/app/AppFooter";
import PlayersHomeView from "./components/app/PlayersHomeView";
import PlayerComparisonView from "./components/app/PlayerComparisonView";
import TeamPage from "./TeamPage";
import LeagueTables from "./LeagueTables";
import FootballAnalyticsTools from "./components/FootballAnalyticsTools";

export default function App() {
  const app = useAppController();

  return (
    <div className="min-h-screen bg-[#f5f7fa] font-sans text-slate-800">
      <AppHeader
        activeView={app.activeView}
        setActiveView={app.setActiveView}
        resetPlayers={app.resetPlayers}
        openAccount={app.openAccount}
        avatarUrl={app.avatarUrl}
        username={app.username}
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
        setPlayerProfileData={app.setPlayerProfileData}
        setPlayerProfileError={app.setPlayerProfileError}
        isGuideOpen={app.isGuideOpen}
        setIsGuideOpen={app.setIsGuideOpen}
        isAccountOpen={app.isAccountOpen}
        tempUsername={app.tempUsername}
        tempAvatar={app.tempAvatar}
        avatarError={app.avatarError}
        setTempUsername={app.setTempUsername}
        handleFileChange={app.handleFileChange}
        saveAccount={app.saveAccount}
        setAvatarError={app.setAvatarError}
        setIsAccountOpen={app.setIsAccountOpen}
      />

      <main className="mx-auto max-w-7xl px-5 pb-12 pt-6 md:px-8">
        <AppTopBar
          selectedSeason={app.selectedSeason}
          setSelectedSeason={app.setSelectedSeason}
          selectedLeague={app.selectedLeague}
          setSelectedLeague={app.setSelectedLeague}
          resetPlayers={app.resetPlayers}
          refreshData={app.refreshData}
          loading={app.loading}
        />

        <AppStatus
          activeView={app.activeView}
          loading={app.loading}
          error={app.error}
          leagueName={app.leagueName}
          selectedSeason={app.selectedSeason}
          loadPlayers={app.loadPlayers}
        />

        {app.activeView === "players" &&
          !app.loading &&
          !app.error &&
          !app.selectedCategory && (
            <PlayersHomeView
              leagueName={app.leagueName}
              selectedSeason={app.selectedSeason}
              leaguePlayers={app.leaguePlayers}
              favorites={app.favorites}
              categories={app.categories}
              setSelectedCategory={app.setSelectedCategory}
              setPlayer1={app.setPlayer1}
              setPlayer2={app.setPlayer2}
              setActiveView={app.setActiveView}
              selectCategory={app.selectCategory}
              openPlayer={app.openPlayer}
              toggleFavorite={app.toggleFavorite}
              setIsGuideOpen={app.setIsGuideOpen}
            />
          )}

        {app.activeView === "players" &&
          !app.loading &&
          !app.error &&
          app.selectedCategory && (
            <PlayerComparisonView
              selectedCategory={app.selectedCategory}
              player1={app.player1}
              player2={app.player2}
              categoryPlayers={app.categoryPlayers}
              captureRef={app.captureRef}
              takeScreenshot={app.takeScreenshot}
              openPlayer={app.openPlayer}
              setPlayer1={app.setPlayer1}
              setPlayer2={app.setPlayer2}
              isFavorite={app.isFavorite}
              toggleFavorite={app.toggleFavorite}
              handlePlayer1Change={app.handlePlayer1Change}
              handlePlayer2Change={app.handlePlayer2Change}
              resetPlayers={app.resetPlayers}
              fdr1={app.fdr1}
              fdr2={app.fdr2}
              fdrLoading={app.fdrLoading}
            />
          )}

        {app.activeView === "teams" && (
          <TeamPage
            competition={app.selectedLeague}
            season={app.apiSeason}
            leagueName={app.leagueName}
          />
        )}

        {app.activeView === "league-tables" && (
          <LeagueTables
            competition={app.selectedLeague}
            season={app.apiSeason}
            leagueName={app.leagueName}
          />
        )}

        {app.activeView === "analytics-tools" && (
          <FootballAnalyticsTools
            competition={app.selectedLeague}
            season={app.apiSeason}
            leagueName={app.leagueName}
          />
        )}

        <AppFooter />
      </main>
    </div>
  );
}