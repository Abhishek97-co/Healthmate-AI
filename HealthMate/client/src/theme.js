export const colorTokens = {
  grey: {
    0: "#FFFFFF",
    10: "#F6F6F6",
    50: "#F0F0F0",
    100: "#E0E0E0",
    200: "#C2C2C2",
    300: "#A3A3A3",
    400: "#858585",
    500: "#666666",
    600: "#4D4D4D",
    700: "#333333",
    800: "#1A1A1A",
    900: "#0A0A0A",
    1000: "#000000",
  },
  primary: {
    50: "#ffebee",
    100: "#ffcdd2",
    200: "#ef9a9a",
    300: "#e57373",
    400: "#ef5350",
    500: "#fd5b5b",
    600: "#e53935",
    700: "#d32f2f",
    800: "#c62828",
    900: "#b71c1c",
  },
};

export const themeSettings = (mode) => {
  return {
    palette: {
      primary: {
        dark: colorTokens.primary[700],
        main: colorTokens.primary[500],
        light: colorTokens.primary[50],
      },
      neutral: {
        dark: colorTokens.grey[700],
        main: colorTokens.grey[500],
        mediumMain: colorTokens.grey[400],
        medium: colorTokens.grey[200],
        light: colorTokens.grey[50],
      },
      background: {
        default: colorTokens.grey[10],
        alt: colorTokens.grey[0],
      },
    },
    typography: {
      fontSize: 12,
      h1: {
        fontSize: 40,
      },
      h2: {
        fontSize: 32,
      },
      h3: {
        fontSize: 24,
      },
      h4: {
        fontSize: 20,
      },
      h5: {
        fontSize: 16,
      },
      h6: {
        fontSize: 14,
      },
    },
    components: {
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderRadius: "12px",
            color: "#f8fafc",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255, 255, 255, 0.1)",
              transition: "border-color 0.2s ease",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#fd5b5b",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#fd5b5b",
            },
            "& .MuiSelect-select": {
              color: "#f8fafc",
            },
            "& select option": {
              backgroundColor: "#1e293b",
              color: "#f8fafc",
            },
          },
          input: {
            "&::placeholder": {
              color: "#94a3b8",
              opacity: 1,
            },
          },
        },
      },
      MuiInput: {
        styleOverrides: {
          root: {
            "&:after": {
              borderBottomColor: "#fd5b5b",
            },
            "&:hover:not(.Mui-disabled):before": {
              borderBottomColor: "#fd5b5b",
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: "#94a3b8",
            "&.Mui-focused": {
              color: "#fd5b5b",
            },
          },
        },
      },
      MuiFormLabel: {
        styleOverrides: {
          root: {
            color: "#94a3b8",
            "&.Mui-focused": {
              color: "#fd5b5b",
            },
          },
        },
      },
    },
  };
};
