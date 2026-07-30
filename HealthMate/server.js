const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const colors = require("colors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const errorHandler = require("./middelwares/errorMiddleware");

//routes path
const authRoutes = require("./routes/authRoutes");

//dotenv
dotenv.config();

//mongo connection
connectDB();

//rest object
const app = express();

//middlewares
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));


const PORT = process.env.PORT || 8080;


app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/openai", require("./routes/openaiRoutes"));
app.use("/api/v1/places", require("./routes/placesRoutes"));
app.use("/api/v1/environment", require("./routes/environmentRoutes"));
app.use("/api/v1/reviews", require("./routes/reviewRoutes"));
app.use(errorHandler);

// SERVE STATIC ASSETS FOR THE FRONTEND
const path = require("path");
const frontendDistPath = path.join(__dirname, "client", "dist");
const frontendIndexPath = path.join(frontendDistPath, "index.html");

if (require("fs").existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    res.sendFile(frontendIndexPath);
  });
}

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(
      `Server Running in ${process.env.DEV_MODE} mode on port no ${PORT}`.bgCyan
        .white
    );
  });
}

module.exports = app;
