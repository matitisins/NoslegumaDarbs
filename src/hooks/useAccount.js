import { useState } from "react";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80";

export default function useAccount() {
  const [username, setUsername] = useState(() => {
    try {
      return (
        localStorage.getItem("radars_username") ||
        "Matīss"
      );
    } catch {
      return "Matīss";
    }
  });

  const [avatarUrl, setAvatarUrl] = useState(() => {
    try {
      return (
        localStorage.getItem("radars_avatar") ||
        DEFAULT_AVATAR
      );
    } catch {
      return DEFAULT_AVATAR;
    }
  });

  const [isAccountOpen, setIsAccountOpen] =
    useState(false);

  const [tempUsername, setTempUsername] =
    useState(username);

  const [tempAvatar, setTempAvatar] =
    useState(avatarUrl);

  const openAccount = () => {
    setTempUsername(username);
    setTempAvatar(avatarUrl);
    setIsAccountOpen(true);
  };

  const closeAccount = () => {
    setTempUsername(username);
    setTempAvatar(avatarUrl);
    setIsAccountOpen(false);
  };

  const handleFileChange = event => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setTempAvatar(reader.result);
      }
    };

    reader.readAsDataURL(file);
  };

  const saveAccount = event => {
    if (event?.preventDefault) {
      event.preventDefault();
    }

    const name =
      tempUsername.trim() || "Matīss";

    setUsername(name);
    setAvatarUrl(tempAvatar);

    try {
      localStorage.setItem(
        "radars_username",
        name
      );

      localStorage.setItem(
        "radars_avatar",
        tempAvatar
      );
    } catch (error) {
      console.error(
        "Neizdevās saglabāt konta informāciju:",
        error
      );
    }

    setIsAccountOpen(false);
  };

  const resetAccount = () => {
    const defaultName = "Matīss";
    const defaultAvatar = DEFAULT_AVATAR;

    setUsername(defaultName);
    setAvatarUrl(defaultAvatar);

    setTempUsername(defaultName);
    setTempAvatar(defaultAvatar);

    try {
      localStorage.setItem(
        "radars_username",
        defaultName
      );

      localStorage.setItem(
        "radars_avatar",
        defaultAvatar
      );
    } catch (error) {
      console.error(
        "Neizdevās atiestatīt kontu:",
        error
      );
    }
  };

  return {
    username,
    setUsername,

    avatarUrl,
    setAvatarUrl,

    isAccountOpen,
    setIsAccountOpen,

    tempUsername,
    setTempUsername,

    tempAvatar,
    setTempAvatar,

    openAccount,
    closeAccount,

    handleFileChange,
    saveAccount,
    resetAccount,

    DEFAULT_AVATAR,
  };
}