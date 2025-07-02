// src/components/Loading.js
import React from "react";
import "../Styles/loading.css";

const Loading = () => {
  return (

<div className="loader">
  <p>L</p>
  <p>O</p>
  <p>A</p>
  <p>D</p>
  <p>I</p>
  <p>N</p>
  <p>G</p>
  <div className="arrows">
    <div className="arrowsup">
      <div className="arrow1"></div>
      <div className="arrow2"></div>
    </div>
    <div className="arrowsbottom">
      <div className="arrow3"></div>
      <div className="arrow4"></div>
    </div>
  </div>
</div>

  );
};

export default Loading;

