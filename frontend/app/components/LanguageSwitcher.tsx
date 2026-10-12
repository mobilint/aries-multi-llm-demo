import PublicIcon from "@mui/icons-material/Public";
import { IconButton, ListItemText, Menu, MenuItem } from "@mui/material";
import { useState } from "react";
import { language_labels } from "../settings";

export default function LanguageSwitcher({
  languages,
  currentLanguage,
  disabled,
  changeLanguage,
}: {
  languages: string[],
  currentLanguage: string,
  disabled: boolean,
  changeLanguage: (language: string) => void,
}) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const isOpen = anchorEl != null;

  return (
    <>
      <IconButton
        disabled={disabled}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          width: "46px",
          height: "46px",
          backgroundColor: "#FFFFFF",
          border: "1px solid rgba(255, 255, 255, 0.18)",
          color: "#0B4EA2",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.22)",
          "&:hover": {
            backgroundColor: "#F4F8FD",
          },
          "&.Mui-disabled": {
            color: "#8392A7",
            backgroundColor: "#E7EDF5",
            borderColor: "#D7DFEF",
            boxShadow: "none",
          },
        }}
      >
        <PublicIcon sx={{ fontSize: "22px" }} />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        {languages.map((language) => {
          const isActive = currentLanguage == language;

          return (
            <MenuItem
              key={language}
              selected={isActive}
              onClick={() => {
                setAnchorEl(null);
                if (language != currentLanguage)
                  changeLanguage(language);
              }}
            >
              <ListItemText
                primary={language_labels[language] ?? language.toUpperCase()}
                secondary={language.toUpperCase()}
                primaryTypographyProps={{
                  fontSize: "14px",
                  fontWeight: isActive ? 700 : 500,
                }}
                secondaryTypographyProps={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  color: "#7A8CA2",
                }}
              />
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
