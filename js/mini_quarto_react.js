import React from 'https://unpkg.com/react@18.2.0/index.js?module';
import { createRoot } from 'https://unpkg.com/react-dom@18.2.0/client.js?module';
import Spline from 'https://unpkg.com/@splinetool/react-spline@4.0.0/dist/react-spline.js?module';

const container = document.getElementById('spline-app');
if (container) {
    const root = createRoot(container);
    root.render(React.createElement(Spline, {
        scene: 'https://prod.spline.design/IngjYToW2o48jZ6F/scene.splinecode'
    }));
}
