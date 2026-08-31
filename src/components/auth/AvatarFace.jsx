import { useEffect, useState } from "react";
import { initialsFromName } from "../../utils/avatar";
import { safeAvatarSrc } from "../../utils/frontendSecurity";

export function AvatarFace({ account, className = "" }) {
  const avatar = safeAvatarSrc(account?.avatarUrl);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [avatar]);

  if (avatar && !failed) {
    return (
      <img
        className={`avatar-image ${className}`.trim()}
        src={avatar}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span className={`avatar-fallback ${className}`.trim()} aria-hidden="true">
      {initialsFromName(account?.name, account?.email)}
    </span>
  );
}

export default AvatarFace;
