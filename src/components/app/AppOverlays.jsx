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
  closePlayerProfile,
  setPlayerProfileData,
  setPlayerProfileError,
  isGuideOpen,
  setIsGuideOpen,
  isAccountOpen,
  username,
  avatarUrl,
  tempUsername,
  tempAvatar,
  avatarError,
  setTempUsername,
  setTempAvatar,
  handleFileChange,
  saveAccount,
  setAvatarError,
  setIsAccountOpen,
}) {
  const compareAndCloseProfile = player => {
    try {
      addToComparison?.(player);
    } finally {
      closePlayerProfile();
    }
  };

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
          onCompare={compareAndCloseProfile}
          onClose={closePlayerProfile}
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
            // Discard unsaved profile edits when cancelling or closing the modal.
            setTempUsername(username || "");
            setTempAvatar(avatarUrl || "");
            setAvatarError("");
            setIsAccountOpen(false);
          }}
        />
      )}
    </>
  );
}