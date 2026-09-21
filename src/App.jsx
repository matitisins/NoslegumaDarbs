import React, { useCallback, useState } from "react";

import AppHeader from "./components/AppHeader";
import AppFooter from "./components/AppFooter";
import AccountModal from "./components/AccountModal";
import GuideModal from "./components/GuideModal";
import AppLoading from "./components/AppLoading";
import AppError from "./components/AppError";
import HomePage from "./components/HomePage";
import ComparisonPage from "./components/ComparisonPage";
import PlayerDetailsModal from "./components/PlayerDetailsModal";

import useFlowPlayers from "./hooks/useFlowPlayers";
import useAccount from "./hooks/useAccount";
import useFavorites from "./hooks/useFavorites";

import takeScreenshot from "./utils/takeScreenshot";

import {
  DEFAULT_LEAGUE,
  DEFAULT_SEASON,
} from "./config/flow";

export default function App() {
  const [selectedLeague, setSelectedLeague] =
    useState(DEFAULT_LEAGUE);

  const [selectedSeason, setSelectedSeason] =
    useState(DEFAULT_SEASON);

  const [detailsPlayer, setDetailsPlayer] =
    useState(null);

  const [guideOpen, setGuideOpen] =
    useState(false);

  /*
   * ACCOUNT
   */
  const {
    username,
    avatarUrl,
    accountOpen,
    tempUsername,
    tempAvatar,
    openAccount,
    closeAccount,
    setTempUsername,
    handleFileChange,
    saveAccount,
  } = useAccount();

  /*
   * PLAYERS
   */
  const {
    leaguePlayers,
    categories,
    categoryPlayers,
    totalPlayers,

    loading,
    error,
    progress,

    selectedCategory,
    setSelectedCategory,

    player1,
    setPlayer1,

    player2,
    setPlayer2,

    playerSearch1,
    setPlayerSearch1,

    playerSearch2,
    setPlayerSearch2,

    fdr1,
    fdr2,
    fdrLoading,

    refreshPlayers,
    resetPlayers,

    selectCategory,
    selectPlayer1,
    selectPlayer2,

    addToComparison,
  } = useFlowPlayers({
    selectedLeague,
    selectedSeason,
  });

  /*
   * FAVORITES
   */
  const {
    favorites,
    isFavorite,
    toggleFavorite,
  } = useFavorites();

  /*
   * OPEN PLAYER DETAILS
   */
  const openPlayer = useCallback(
    player => {
      if (!player) {
        return;
      }

      setDetailsPlayer(player);
    },
    []
  );

  /*
   * CLOSE PLAYER DETAILS
   */
  const closePlayerDetails =
    useCallback(() => {
      setDetailsPlayer(null);
    }, []);

  /*
   * CATEGORY
   */
  const handleCategorySelect =
    useCallback(
      category => {
        selectCategory(category);
      },
      [selectCategory]
    );

  /*
   * PLAYER 1
   */
  const handlePlayer1Select =
    useCallback(
      player => {
        if (!player) {
          return;
        }

        selectPlayer1(player);
        setPlayerSearch1("");
      },
      [
        selectPlayer1,
        setPlayerSearch1,
      ]
    );

  /*
   * PLAYER 2
   */
  const handlePlayer2Select =
    useCallback(
      player => {
        if (!player) {
          return;
        }

        selectPlayer2(player);
        setPlayerSearch2("");
      },
      [
        selectPlayer2,
        setPlayerSearch2,
      ]
    );

  /*
   * ADD TO COMPARISON
   */
  const handleAddToComparison =
    useCallback(
      player => {
        if (!player) {
          return;
        }

        addToComparison(player);
        setDetailsPlayer(null);
      },
      [addToComparison]
    );

  /*
   * HOME
   */
  const goHome = useCallback(() => {
    resetPlayers();
    setDetailsPlayer(null);
  }, [resetPlayers]);

  /*
   * SCREENSHOT
   */
  const handleScreenshot =
    useCallback(() => {
      const element =
        document.getElementById(
          "flow-comparison"
        );

      if (!element) {
        return;
      }

      takeScreenshot(
        element,
        player1,
        player2
      );
    }, [
      player1,
      player2,
    ]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader
        username={username}
        avatarUrl={avatarUrl}
        onHome={goHome}
        onGuide={() =>
          setGuideOpen(true)
        }
        onAccount={openAccount}
      />

      {guideOpen && (
        <GuideModal
          onClose={() =>
            setGuideOpen(false)
          }
        />
      )}

      {accountOpen && (
        <AccountModal
          username={tempUsername}
          avatar={tempAvatar}
          onUsernameChange={
            setTempUsername
          }
          onFileChange={
            handleFileChange
          }
          onSave={saveAccount}
          onClose={closeAccount}
        />
      )}

      {detailsPlayer && (
        <PlayerDetailsModal
          player={detailsPlayer}
          isFavorite={isFavorite(
            detailsPlayer
          )}
          onToggleFavorite={
            toggleFavorite
          }
          onClose={
            closePlayerDetails
          }
          onCompare={
            handleAddToComparison
          }
        />
      )}

      <main className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        {loading && (
          <AppLoading
            progress={progress}
          />
        )}

        {!loading && error && (
          <AppError
            error={error}
            onRetry={refreshPlayers}
          />
        )}

        {!loading &&
          !error &&
          !selectedCategory && (
            <HomePage
              selectedLeague={
                selectedLeague
              }
              selectedSeason={
                selectedSeason
              }
              setSelectedLeague={
                setSelectedLeague
              }
              setSelectedSeason={
                setSelectedSeason
              }
              leaguePlayers={
                leaguePlayers
              }
              categories={
                categories
              }
              totalPlayers={
                totalPlayers
              }
              favorites={
                favorites
              }
              onCategorySelect={
                handleCategorySelect
              }
              onPlayerOpen={
                openPlayer
              }
              onToggleFavorite={
                toggleFavorite
              }
            />
          )}

        {!loading &&
          !error &&
          selectedCategory && (
            <ComparisonPage
              selectedCategory={
                selectedCategory
              }
              player1={player1}
              player2={player2}
              categoryPlayers={
                categoryPlayers
              }
              playerSearch1={
                playerSearch1
              }
              playerSearch2={
                playerSearch2
              }
              setPlayerSearch1={
                setPlayerSearch1
              }
              setPlayerSearch2={
                setPlayerSearch2
              }
              setPlayer1={
                setPlayer1
              }
              setPlayer2={
                setPlayer2
              }
              isFavorite={
                isFavorite
              }
              toggleFavorite={
                toggleFavorite
              }
              openPlayer={
                openPlayer
              }
              onSelectPlayer1={
                handlePlayer1Select
              }
              onSelectPlayer2={
                handlePlayer2Select
              }
              fdr1={fdr1}
              fdr2={fdr2}
              fdrLoading={
                fdrLoading
              }
              onBack={goHome}
              onScreenshot={
                handleScreenshot
              }
            />
          )}
      </main>

      <AppFooter />
    </div>
  );
}