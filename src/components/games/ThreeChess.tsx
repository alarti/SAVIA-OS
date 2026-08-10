import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { soundEngine } from '../../utils/soundEngine';
import { RotateCcw, Award, User, Bot, RefreshCw, Zap, Sparkles, Brain, Cpu } from 'lucide-react';

type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
type PieceColor = 'w' | 'b';

interface ChessPiece {
  type: PieceType;
  color: PieceColor;
  row: number;
  col: number;
  mesh?: THREE.Group;
}

const PIECE_NAMES: Record<PieceType, string> = {
  p: 'Peón',
  r: 'Torre',
  n: 'Caballo',
  b: 'Alfil',
  q: 'Reina',
  k: 'Rey'
};

const PIECE_VALUES: Record<PieceType, number> = {
  p: 10,
  n: 30,
  b: 30,
  r: 50,
  q: 90,
  k: 1000
};

export const ThreeChess: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [turn, setTurn] = useState<PieceColor>('w');
  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(null);
  const [validMoves, setValidMoves] = useState<[number, number][]>([]);
  const [vsAi, setVsAi] = useState(true);
  const [aiLevel, setAiLevel] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [capturedWhite, setCapturedWhite] = useState<PieceType[]>([]);
  const [capturedBlack, setCapturedBlack] = useState<PieceType[]>([]);
  const [statusMsg, setStatusMsg] = useState('Tu turno (Blancas): Selecciona una pieza 3D');
  const [winner, setWinner] = useState<string | null>(null);
  const [lastMoveMsg, setLastMoveMsg] = useState<string>('Partida iniciada contra NPC Bot');

  // Board State matrix [row][col] (0-7, 0=row 1 black side, 7=row 8 white side)
  const boardRef = useRef<(ChessPiece | null)[][]>([]);
  const piecesMeshGroupRef = useRef<THREE.Group | null>(null);
  const highlightsGroupRef = useRef<THREE.Group | null>(null);
  const render3DPiecesRef = useRef<() => void>(() => {});
  const updateHighlightsRef = useRef<(sel: [number, number] | null, moves: [number, number][]) => void>(() => {});

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

  // Convert board coordinate (row, col) to chess notation (e.g. e4)
  const toNotation = (r: number, c: number): string => {
    const colLetter = String.fromCharCode(97 + c);
    const rowNum = 8 - r;
    return `${colLetter}${rowNum}`;
  };

  // --- THREE.JS INITIALIZATION EFFECT ---
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 17, 15);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff8eb, 1.3);
    dirLight.position.set(20, 30, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // 2. Build 3D Board
    const boardGroup = new THREE.Group();

    // Wood Border Base
    const baseGeo = new THREE.BoxGeometry(10.6, 0.8, 10.6);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.4;
    baseMesh.receiveShadow = true;
    boardGroup.add(baseMesh);

    // 8x8 Tiles
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35 });
    const tileGeo = new THREE.BoxGeometry(1.15, 0.2, 1.15);

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const isLight = (r + c) % 2 === 0;
        const tile = new THREE.Mesh(tileGeo, isLight ? lightMat : darkMat);
        tile.position.set(c * 1.2 - 4.2, 0, r * 1.2 - 4.2);
        tile.receiveShadow = true;
        tile.userData = { row: r, col: c };
        boardGroup.add(tile);
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

    // 3. Procedural 3D Piece Models
    const createPieceMesh = (type: PieceType, color: PieceColor): THREE.Group => {
      const g = new THREE.Group();
      const pColor = color === 'w' ? 0xf8fafc : 0x0f172a;
      const mat = new THREE.MeshStandardMaterial({
        color: pColor,
        roughness: 0.2,
        metalness: color === 'w' ? 0.1 : 0.6,
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

    // Render 3D Piece Meshes
    const render3DPieces = () => {
      if (!piecesMeshGroupRef.current) return;
      const group = piecesMeshGroupRef.current;
      while (group.children.length > 0) {
        group.remove(group.children[0]);
      }

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = boardRef.current[r][c];
          if (piece) {
            const mesh = createPieceMesh(piece.type, piece.color);
            mesh.position.set(c * 1.2 - 4.2, 0.1, r * 1.2 - 4.2);
            piece.mesh = mesh;
            group.add(mesh);
          }
        }
      }
    };
    render3DPiecesRef.current = render3DPieces;

    // Render Highlights
    const updateHighlights = (sel: [number, number] | null, moves: [number, number][]) => {
      if (!highlightsGroupRef.current) return;
      const group = highlightsGroupRef.current;
      while (group.children.length > 0) {
        group.remove(group.children[0]);
      }
      if (!sel) return;

      // Selection Marker
      const selMarker = new THREE.Mesh(
        new THREE.RingGeometry(0.4, 0.55, 32),
        new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide })
      );
      selMarker.rotation.x = -Math.PI / 2;
      selMarker.position.set(sel[1] * 1.2 - 4.2, 0.12, sel[0] * 1.2 - 4.2);
      group.add(selMarker);

      // Valid Moves Markers
      moves.forEach(([mr, mc]) => {
        const targetPiece = boardRef.current[mr][mc];
        const moveMarker = new THREE.Mesh(
          new THREE.RingGeometry(0.3, 0.48, 32),
          new THREE.MeshBasicMaterial({ color: targetPiece ? 0xef4444 : 0x10b981, side: THREE.DoubleSide })
        );
        moveMarker.rotation.x = -Math.PI / 2;
        moveMarker.position.set(mc * 1.2 - 4.2, 0.12, mr * 1.2 - 4.2);
        group.add(moveMarker);
      });
    };
    updateHighlightsRef.current = updateHighlights;

    // Initialize board state if empty
    if (boardRef.current.length === 0 || boardRef.current.every(row => row.every(cell => cell === null))) {
      boardRef.current = initBoardData();
    }
    render3DPieces();

    // 4. Raycaster & Interactivity
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const getBoardCoordsFromPoint = (point: THREE.Vector3): [number, number] | null => {
      const col = Math.round((point.x + 4.2) / 1.2);
      const row = Math.round((point.z + 4.2) / 1.2);
      if (row >= 0 && row < 8 && col >= 0 && col < 8) return [row, col];
      return null;
    };

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

              let moveNote = `${PIECE_NAMES[movingPiece.type]} de ${toNotation(sr, sc)} a ${toNotation(r, c)}`;

              // Check if captured
              if (clickedPiece) {
                if (clickedPiece.color === 'w') setCapturedWhite(prev => [...prev, clickedPiece.type]);
                else setCapturedBlack(prev => [...prev, clickedPiece.type]);

                moveNote += ` (Captura ${PIECE_NAMES[clickedPiece.type]})`;

                if (clickedPiece.type === 'k') {
                  setWinner('Blancas (Jugador)');
                  setStatusMsg('🏆 ¡JAQUE MATE! Has capturado al Rey de la IA.');
                }
              }

              // Update board state
              currentBoard[r][c] = { ...movingPiece, row: r, col: c };
              currentBoard[sr][sc] = null;

              render3DPieces();
              updateHighlights(null, []);
              setLastMoveMsg(`Blancas: ${moveNote}`);

              // Switch Turn
              setTurn('b');
              setStatusMsg('Turno del NPC Bot (Negras)... Pensando movimiento');

              return null;
            }
          }

          // Select piece (only if it's white's turn or 2-player)
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

  // --- NPC BOT / AI AUTOMATIC TURN TRIGGER ---
  useEffect(() => {
    if (turn !== 'b' || !vsAi || winner) return;

    setIsAiThinking(true);
    setStatusMsg('🤖 NPC Bot (Negras) está calculando jugada...');

    const timer = setTimeout(() => {
      const currentBoard = boardRef.current;

      // 1. Collect all legal moves for Black
      interface CandidateMove {
        from: [number, number];
        to: [number, number];
        piece: ChessPiece;
        target: ChessPiece | null;
        score: number;
      }

      const candidateMoves: CandidateMove[] = [];

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = currentBoard[r][c];
          if (piece && piece.color === 'b') {
            const moves = getLegalMoves(r, c, currentBoard);
            moves.forEach(([tr, tc]) => {
              const target = currentBoard[tr][tc];
              let score = Math.random() * 5; // Base noise for variability

              // Evaluation rules
              if (target) {
                score += PIECE_VALUES[target.type] * 10; // High priority captures
              }

              // Center control bonus
              if ((tr === 3 || tr === 4) && (tc >= 2 && tc <= 5)) {
                score += 8;
              }

              // Pawn advancement
              if (piece.type === 'p') {
                score += tr * 2;
              }

              // Difficulty variations
              if (aiLevel === 'easy') {
                score = Math.random() * 20 + (target ? PIECE_VALUES[target.type] : 0);
              } else if (aiLevel === 'hard') {
                // Hard mode checks if the destination is threatened
                const isThreatened = (tr >= 0 && tr < 8);
                if (isThreatened && target) score += 5;
              }

              candidateMoves.push({
                from: [r, c],
                to: [tr, tc],
                piece,
                target,
                score
              });
            });
          }
        }
      }

      if (candidateMoves.length === 0) {
        setWinner('Blancas (Jugador)');
        setStatusMsg('🏆 ¡JAQUE MATE / TABLAS! El NPC Bot no tiene movimientos.');
        setIsAiThinking(false);
        return;
      }

      // 2. Select best move
      candidateMoves.sort((a, b) => b.score - a.score);
      const chosenMove = candidateMoves[0];

      const [fr, fc] = chosenMove.from;
      const [tr, tc] = chosenMove.to;
      const movingPiece = currentBoard[fr][fc]!;
      const capturedPiece = currentBoard[tr][tc];

      let moveNote = `${PIECE_NAMES[movingPiece.type]} de ${toNotation(fr, fc)} a ${toNotation(tr, tc)}`;

      // Execute Move on Board
      if (capturedPiece) {
        setCapturedBlack(prev => [...prev, capturedPiece.type]);
        moveNote += ` (Capturó ${PIECE_NAMES[capturedPiece.type]})`;

        if (capturedPiece.type === 'k') {
          setWinner('NPC Bot (Negras)');
          setStatusMsg('💀 ¡JAQUE MATE! El NPC Bot ha capturado a tu Rey.');
        }
      }

      currentBoard[tr][tc] = { ...movingPiece, row: tr, col: tc };
      currentBoard[fr][fc] = null;

      // Update 3D render
      if (render3DPiecesRef.current) render3DPiecesRef.current();
      if (updateHighlightsRef.current) updateHighlightsRef.current(null, []);

      soundEngine.playButtonClick();
      setLastMoveMsg(`NPC Bot: ${moveNote}`);
      setIsAiThinking(false);

      if (!capturedPiece || capturedPiece.type !== 'k') {
        setTurn('w');
        setStatusMsg('Tu turno (Blancas): Selecciona una pieza 3D');
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [turn, vsAi, aiLevel, winner]);

  const handleReset = () => {
    boardRef.current = initBoardData();
    if (render3DPiecesRef.current) render3DPiecesRef.current();
    if (updateHighlightsRef.current) updateHighlightsRef.current(null, []);
    setTurn('w');
    setSelectedPos(null);
    setValidMoves([]);
    setCapturedWhite([]);
    setCapturedBlack([]);
    setWinner(null);
    setLastMoveMsg('Partida reiniciada');
    setStatusMsg('Juego Reiniciado: Tu turno (Blancas)');
  };

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden flex flex-col font-sans select-none">
      {/* TOP HUD BAR */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-slate-900/90 p-3.5 rounded-2xl border border-slate-700/60 backdrop-blur shadow-2xl text-xs text-white max-w-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-amber-400 font-bold flex items-center gap-1.5 text-sm">
            ♟️ Ajedrez 3D vs NPC Bot
          </span>
          <span className={`px-2.5 py-0.5 rounded-lg border font-bold text-xs flex items-center gap-1 ${
            turn === 'w' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}>
            {turn === 'w' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 animate-bounce" />}
            {turn === 'w' ? 'Tu Turno (Blancas)' : 'NPC Bot (Negras)'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 text-[11px] text-gray-300 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
          <span className="truncate">{statusMsg}</span>
          {isAiThinking && <Cpu className="w-4 h-4 text-sky-400 animate-spin shrink-0" />}
        </div>

        {lastMoveMsg && (
          <div className="text-[10px] text-sky-300/80 font-mono italic">
            Último movimiento: {lastMoveMsg}
          </div>
        )}

        {/* CAPTURED PIECES SUMMARY */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px]">
          <div className="flex items-center gap-1 text-gray-300">
            <span>Piezas de IA capturadas:</span>
            <span className="font-bold text-amber-300">{capturedBlack.map(p => PIECE_NAMES[p]).join(', ') || 'Ninguna'}</span>
          </div>
        </div>
      </div>

      {/* TOP RIGHT CONTROLS BAR */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <div className="flex items-center bg-slate-900/90 border border-slate-700/60 p-1 rounded-xl backdrop-blur shadow-xl">
          <button
            onClick={() => setVsAi(!vsAi)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              vsAi ? 'bg-purple-600 text-white' : 'bg-slate-800 text-gray-400'
            }`}
          >
            {vsAi ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
            <span>{vsAi ? 'vs NPC Bot (IA)' : '2 Jugadores'}</span>
          </button>

          {vsAi && (
            <select
              value={aiLevel}
              onChange={(e) => setAiLevel(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-amber-300 font-medium focus:outline-none ml-1 cursor-pointer"
            >
              <option value="easy">IA Fácil</option>
              <option value="normal">IA Normal</option>
              <option value="hard">IA Avanzada</option>
            </select>
          )}
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-600 shadow-xl transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>Reiniciar</span>
        </button>
      </div>

      {/* WINNER MODAL OVERLAY */}
      {winner && (
        <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 text-center max-w-sm shadow-2xl flex flex-col items-center gap-3 animate-fade-in">
            <Award className="w-12 h-12 text-amber-400 animate-bounce" />
            <h3 className="text-lg font-bold text-white">¡Fin de la Partida!</h3>
            <p className="text-sm text-gray-300">Ganador: <strong className="text-amber-300">{winner}</strong></p>
            <button
              onClick={handleReset}
              className="mt-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs rounded-xl hover:brightness-110 transition-all cursor-pointer shadow-lg"
            >
              Jugar de Nuevo
            </button>
          </div>
        </div>
      )}

      {/* 3D CANVAS VIEWPORT */}
      <div ref={mountRef} className="w-full h-full flex-1 cursor-pointer" />

      {/* FOOTER BAR */}
      <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-gray-400 z-10">
        <span>Instrucciones: Haz clic sobre cualquier pieza 3D para seleccionarla y realiza tu movimiento contra el NPC Bot.</span>
        <span className="text-amber-400 font-mono flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" /> Three.js Raycaster + IA Local
        </span>
      </div>
    </div>
  );
};
