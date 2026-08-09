import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { soundEngine } from '../../utils/soundEngine';
import { RotateCcw, Award, User, Bot, RefreshCw, Eye } from 'lucide-react';

type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
type PieceColor = 'w' | 'b';

interface ChessPiece {
  type: PieceType;
  color: PieceColor;
  row: number;
  col: number;
  mesh?: THREE.Group;
}

export const ThreeChess: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [turn, setTurn] = useState<PieceColor>('w');
  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(null);
  const [validMoves, setValidMoves] = useState<[number, number][]>([]);
  const [vsAi, setVsAi] = useState(true);
  const [capturedWhite, setCapturedWhite] = useState<PieceType[]>([]);
  const [capturedBlack, setCapturedBlack] = useState<PieceType[]>([]);
  const [statusMsg, setStatusMsg] = useState('Turno de Blancas: Selecciona una pieza 3D');
  const [winner, setWinner] = useState<string | null>(null);

  // Board State matrix [row][col] (0-7, 0=row 1 black side, 7=row 8 white side)
  const boardRef = useRef<(ChessPiece | null)[][]>([]);
  const piecesMeshGroupRef = useRef<THREE.Group | null>(null);
  const highlightsGroupRef = useRef<THREE.Group | null>(null);

  // Initial Board Setup
  const initBoardData = (): (ChessPiece | null)[][] => {
    const b: (ChessPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));

    // Black pieces (row 0, 1)
    const backRow: PieceType[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    for (let col = 0; col < 8; col++) {
      b[0][col] = { type: backRow[col], color: 'b', row: 0, col };
      b[1][col] = { type: 'p', color: 'b', row: 1, col };
    }

    // White pieces (row 6, 7)
    for (let col = 0; col < 8; col++) {
      b[6][col] = { type: 'p', color: 'w', row: 6, col };
      b[7][col] = { type: backRow[col], color: 'w', row: 7, col };
    }

    return b;
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 18, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff8eb, 1.2);
    dirLight.position.set(20, 30, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // 2. Build 3D Board
    const boardGroup = new THREE.Group();

    // Wood Border Base
    const baseGeo = new THREE.BoxGeometry(10.5, 0.8, 10.5);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.4;
    baseMesh.receiveShadow = true;
    boardGroup.add(baseMesh);

    // 8x8 Tiles
    const tilesGrid: THREE.Mesh[][] = [];
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3 });
    const tileGeo = new THREE.BoxGeometry(1.15, 0.2, 1.15);

    for (let r = 0; r < 8; r++) {
      tilesGrid[r] = [];
      for (let c = 0; c < 8; c++) {
        const isLight = (r + c) % 2 === 0;
        const tile = new THREE.Mesh(tileGeo, isLight ? lightMat : darkMat);
        // Translate matrix (0,0) at top-left (-4 to +4 space)
        tile.position.set(c * 1.2 - 4.2, 0, r * 1.2 - 4.2);
        tile.receiveShadow = true;
        tile.userData = { row: r, col: c };
        boardGroup.add(tile);
        tilesGrid[r][c] = tile;
      }
    }
    scene.add(boardGroup);

    // Group for active piece meshes
    const piecesGroup = new THREE.Group();
    scene.add(piecesGroup);
    piecesMeshGroupRef.current = piecesGroup;

    // Group for tile highlights
    const highlightsGroup = new THREE.Group();
    scene.add(highlightsGroup);
    highlightsGroupRef.current = highlightsGroup;

    // 3. Procedural 3D Piece Models Generator
    const createPieceMesh = (type: PieceType, color: PieceColor): THREE.Group => {
      const g = new THREE.Group();
      const pColor = color === 'w' ? 0xf8fafc : 0x0f172a;
      const mat = new THREE.MeshStandardMaterial({
        color: pColor,
        roughness: 0.2,
        metalness: color === 'w' ? 0.1 : 0.5,
      });

      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.2, 16), mat);
      base.position.y = 0.1;
      base.castShadow = true;
      g.add(base);

      if (type === 'p') {
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.4, 0.7, 16), mat);
        body.position.y = 0.55;
        g.add(body);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), mat);
        head.position.y = 1.0;
        g.add(head);
      } else if (type === 'r') {
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 1.0, 16), mat);
        body.position.y = 0.7;
        g.add(body);
        const top = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.7), mat);
        top.position.y = 1.25;
        g.add(top);
      } else if (type === 'n') {
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 0.9, 16), mat);
        body.position.y = 0.65;
        g.add(body);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.7), mat);
        head.position.set(0, 1.1, 0.1);
        head.rotation.x = -0.3;
        g.add(head);
      } else if (type === 'b') {
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.4, 1.1, 16), mat);
        body.position.y = 0.75;
        g.add(body);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), mat);
        head.position.y = 1.35;
        g.add(head);
      } else if (type === 'q') {
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.45, 1.4, 16), mat);
        body.position.y = 0.9;
        g.add(body);
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.2, 0.3, 12), mat);
        crown.position.y = 1.65;
        g.add(crown);
      } else if (type === 'k') {
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.48, 1.5, 16), mat);
        body.position.y = 0.95;
        g.add(body);
        const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.12), mat);
        crossH.position.y = 1.8;
        g.add(crossH);
        const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.12), mat);
        crossV.position.y = 1.8;
        g.add(crossV);
      }

      g.scale.set(0.85, 0.85, 0.85);
      return g;
    };

    // Render Pieces on 3D Board
    boardRef.current = initBoardData();

    const render3DPieces = () => {
      if (!piecesGroup) return;
      while (piecesGroup.children.length > 0) {
        piecesGroup.remove(piecesGroup.children[0]);
      }

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = boardRef.current[r][c];
          if (piece) {
            const mesh = createPieceMesh(piece.type, piece.color);
            mesh.position.set(c * 1.2 - 4.2, 0.1, r * 1.2 - 4.2);
            piece.mesh = mesh;
            piecesGroup.add(mesh);
          }
        }
      }
    };

    render3DPieces();

    // 4. Raycaster & Clicking Interactivity
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const getBoardCoordsFromPoint = (point: THREE.Vector3): [number, number] | null => {
      const col = Math.round((point.x + 4.2) / 1.2);
      const row = Math.round((point.z + 4.2) / 1.2);
      if (row >= 0 && row < 8 && col >= 0 && col < 8) return [row, col];
      return null;
    };

    // Calculate Chess Move Rules
    const getLegalMoves = (r: number, c: number, board: (ChessPiece | null)[][]): [number, number][] => {
      const p = board[r][c];
      if (!p) return [];

      const moves: [number, number][] = [];
      const isWhite = p.color === 'w';
      const forward = isWhite ? -1 : 1;

      if (p.type === 'p') {
        // Forward 1
        const nr = r + forward;
        if (nr >= 0 && nr < 8 && !board[nr][c]) {
          moves.push([nr, c]);
          // Forward 2 from start
          const startRow = isWhite ? 6 : 1;
          const nr2 = r + forward * 2;
          if (r === startRow && !board[nr2][c]) {
            moves.push([nr2, c]);
          }
        }
        // Diagonal captures
        [-1, 1].forEach(dc => {
          const nc = c + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const target = board[nr][nc];
            if (target && target.color !== p.color) {
              moves.push([nr, nc]);
            }
          }
        });
      } else if (p.type === 'n') {
        const offsets = [
          [-2, -1], [-2, 1], [-1, -2], [-1, 2],
          [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        offsets.forEach(([dr, dc]) => {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const target = board[nr][nc];
            if (!target || target.color !== p.color) moves.push([nr, nc]);
          }
        });
      } else if (p.type === 'r' || p.type === 'b' || p.type === 'q') {
        const dirs: [number, number][] = [];
        if (p.type === 'r' || p.type === 'q') dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
        if (p.type === 'b' || p.type === 'q') dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);

        dirs.forEach(([dr, dc]) => {
          let step = 1;
          while (true) {
            const nr = r + dr * step;
            const nc = c + dc * step;
            if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
            const target = board[nr][nc];
            if (!target) {
              moves.push([nr, nc]);
            } else {
              if (target.color !== p.color) moves.push([nr, nc]);
              break;
            }
            step++;
          }
        });
      } else if (p.type === 'k') {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
              const target = board[nr][nc];
              if (!target || target.color !== p.color) moves.push([nr, nc]);
            }
          }
        }
      }

      return moves;
    };

    // Render Highlights
    const updateHighlights = (sel: [number, number] | null, moves: [number, number][]) => {
      while (highlightsGroup.children.length > 0) {
        highlightsGroup.remove(highlightsGroup.children[0]);
      }
      if (!sel) return;

      // Selection Marker
      const selMarker = new THREE.Mesh(
        new THREE.RingGeometry(0.4, 0.55, 32),
        new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide })
      );
      selMarker.rotation.x = -Math.PI / 2;
      selMarker.position.set(sel[1] * 1.2 - 4.2, 0.12, sel[0] * 1.2 - 4.2);
      highlightsGroup.add(selMarker);

      // Valid Moves Markers
      moves.forEach(([mr, mc]) => {
        const targetPiece = boardRef.current[mr][mc];
        const moveMarker = new THREE.Mesh(
          new THREE.RingGeometry(0.3, 0.48, 32),
          new THREE.MeshBasicMaterial({ color: targetPiece ? 0xef4444 : 0x10b981, side: THREE.DoubleSide })
        );
        moveMarker.rotation.x = -Math.PI / 2;
        moveMarker.position.set(mc * 1.2 - 4.2, 0.12, mr * 1.2 - 4.2);
        highlightsGroup.add(moveMarker);
      });
    };

    // Handle Click Selection & Movement
    const handleClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(boardGroup.children, true);

      if (intersects.length > 0) {
        const point = intersects[0].point;
        const coords = getBoardCoordsFromPoint(point);
        if (!coords) return;

        const [r, c] = coords;
        const currentBoard = boardRef.current;
        const clickedPiece = currentBoard[r][c];

        setSelectedPos(prevSel => {
          if (prevSel) {
            const [sr, sc] = prevSel;
            const valid = getLegalMoves(sr, sc, currentBoard);
            const isMoveValid = valid.some(([vr, vc]) => vr === r && vc === c);

            if (isMoveValid) {
              // Execute Move
              soundEngine.playButtonClick();
              const movingPiece = currentBoard[sr][sc]!;

              // Check if captured
              if (clickedPiece) {
                if (clickedPiece.color === 'w') setCapturedWhite(prev => [...prev, clickedPiece.type]);
                else setCapturedBlack(prev => [...prev, clickedPiece.type]);

                if (clickedPiece.type === 'k') {
                  setWinner(movingPiece.color === 'w' ? 'Blancas' : 'Negras');
                  setStatusMsg(`🏆 ¡JAQUE MATE! Ganan las ${movingPiece.color === 'w' ? 'Blancas' : 'Negras'}`);
                }
              }

              // Update board state
              currentBoard[r][c] = { ...movingPiece, row: r, col: c };
              currentBoard[sr][sc] = null;

              render3DPieces();
              updateHighlights(null, []);

              // Switch Turn
              const nextTurn = movingPiece.color === 'w' ? 'b' : 'w';
              setTurn(nextTurn);
              setStatusMsg(`Turno de ${nextTurn === 'w' ? 'Blancas' : 'Negras'}`);

              return null;
            }
          }

          // Select piece
          if (clickedPiece && clickedPiece.color === turn) {
            soundEngine.playSuccessTone();
            const moves = getLegalMoves(r, c, currentBoard);
            setValidMoves(moves);
            updateHighlights([r, c], moves);
            return [r, c];
          }

          updateHighlights(null, []);
          return null;
        });
      }
    };

    renderer.domElement.addEventListener('click', handleClick);

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [turn]);

  const handleReset = () => {
    boardRef.current = initBoardData();
    setTurn('w');
    setSelectedPos(null);
    setValidMoves([]);
    setCapturedWhite([]);
    setCapturedBlack([]);
    setWinner(null);
    setStatusMsg('Juego Reiniciado: Turno de Blancas');
  };

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden flex flex-col font-sans select-none">
      {/* TOP HUD BAR */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-700/60 backdrop-blur shadow-2xl font-mono text-xs text-white">
        <div className="flex items-center justify-between gap-6">
          <span className="text-amber-400 font-bold flex items-center gap-1.5 text-sm">
            ♟️ Ajedrez 3D Three.js
          </span>
          <span className={`px-2.5 py-0.5 rounded-lg border font-bold text-xs ${turn === 'w' ? 'bg-slate-100 text-slate-900 border-white' : 'bg-slate-950 text-white border-slate-700'}`}>
            Turno: {turn === 'w' ? '⚪ Blancas' : '⚫ Negras'}
          </span>
        </div>

        <div className="text-gray-300 text-xs mt-1">
          {statusMsg}
        </div>
      </div>

      {/* TOP RIGHT RESET BUTTON */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono rounded-xl border border-slate-600 shadow-xl transition-all"
        >
          <RotateCcw className="w-4 h-4 text-amber-400" />
          <span>Reiniciar Tablero</span>
        </button>
      </div>

      {/* 3D CANVAS VIEWPORT */}
      <div ref={mountRef} className="w-full h-full flex-1 cursor-pointer" />

      {/* FOOTER BAR */}
      <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-gray-400 z-10">
        <span>Instrucciones: Haz clic sobre cualquier pieza 3D para seleccionarla y ver los movimientos legales resaltados.</span>
        <span className="text-amber-400 font-mono">Renderizado Raycaster Three.js</span>
      </div>
    </div>
  );
};
