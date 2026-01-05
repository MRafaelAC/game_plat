import React from 'react';
import './App.css';
import PlayerCanvas from './PlayerCanvas';

const BG_URL = process.env.PUBLIC_URL + '/assets/Background.png';

function App() {
  const style = {
    backgroundImage: `url(${BG_URL})`,
    backgroundPosition: 'center bottom',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    imageRendering: 'pixelated'
  };

  return (
    <div className="App" style={style}>
      {/* Player rendered on canvas using precise frame slicing */}
      <PlayerCanvas staticSprite={process.env.PUBLIC_URL + '/assets/ps.png'} frameRate={8} scale={0.8} bottomOffset={12} showHitbox={false} showPlatform={false} initialX={48} platformHeight={56} platformOffset={18} footOffset={36} />
    </div>
  );
}

export default App;
