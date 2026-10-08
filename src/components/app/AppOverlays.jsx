import React from "react";
import AccountModal from "../AccountModal";
import GuideModal from "../GuideModal";
import { PlayerDetailsModal } from "./AppComponents";

export default function AppOverlays({
  detailsPlayer,
  isFavorite,
  playerProfileData,
  playerProfileLoading,
  playerProfileError,
  toggleFavorite,
  addToComparison,
  setDetailsPlayer,
  setPlayerProfileData,
  setPlayerProfileError,
  isGuideOpen,
  setIsGuideOpen,
  isAccountOpen,
  tempUsername,
  tempAvatar,
  avatarError,
  setTempUsername,
  handleFileChange,
  saveAccount,
  setAvatarError,
  setIsAccountOpen,
}) {
  return (
    <>
      {detailsPlayer && (
        <PlayerDetailsModal
          player={detailsPlayer}
          favorite={isFavorite(detailsPlayer)}
          profileData={playerProfileData}
          profileLoading={playerProfileLoading}
          profileError={playerProfileError}
          onToggleFavorite={toggleFavorite}
          onCompare={addToComparison}
          onClose={() => {
            setDetailsPlayer(null);
            setPlayerProfileData(null);
            setPlayerProfileError("");
          }}
        />
      )}

      {isGuideOpen && (
        <GuideModal
          onClose={() => setIsGuideOpen(false)}
        />
      )}

      {isAccountOpen && (
        <AccountModal
          username={tempUsername}
          avatar={tempAvatar}
          fileError={avatarError}
          onUsernameChange={setTempUsername}
          onFileChange={handleFileChange}
          onSave={saveAccount}
          onClose={() => {
            setAvatarError("");
            setIsAccountOpen(false);
          }}
        />
      )}
    </>
  );
}