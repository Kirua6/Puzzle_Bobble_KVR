// Attendre que la page soit complètement chargée avant de démarrer le jeu
window.onload = function() {
    // Obtention du canvas et du contexte
    var canvas = document.getElementById("viewport");
    var context = canvas.getContext("2d");

    // Gestion du temps et des frames par seconde
    var lastframe = 0;
    var fpstime = 0;
    var framecount = 0;
    var fps = 0;

    var initialized = false;

    // Niveau
    var niveau = {
        x: 4,           // Position X
        y: 83,          // Position Y
        width: 0,       // Largeur, calculée plus tard
        height: 0,      // Hauteur, calculée plus tard
        colonnes: 15,    // Nombre de colonnes
        rangees: 14,       // Nombre de rangées
        tuilewidth: 40,  // Largeur visuelle d'une boule
        tuileheight: 40, // Hauteur visuelle d'une boule
        rangeesheight: 34,  // Hauteur d'une ligne
        radius: 20,     // Rayon de collision des bulles
        tuiles: []       // Le tableau à deux dimensions  
    };

    // Définition d'une tuile
    var Tuile = function(x, y, type, shift) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.removed = false;
        this.shift = shift;
        this.velocity = 0;
        this.alpha = 1;
        this.processed = false;
    };

    // Joueur
    var joueur = {
        x: 0,
        y: 0,
        angle: 0,
        tuiletype: 0,
        bulle: {
            x: 0,
            y: 0,
            angle: 0,
            speed: 1000,
            dropspeed: 900,
            tuiletype: 0,
            visible: false
        },
        nextbulle: {
            x: 0,
            y: 0,
            tuiletype: 0
        }
    };

    // Offset des voisins
    var neighborsoffsets = [[[1, 0], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1]], // Tuiles sur une rangée paire
                            [[1, 0], [1, 1], [0, 1], [-1, 0], [0, -1], [1, -1]]];  // Tuiles sur une rangée impaire

    // Nombre de couleurs différentes
    var bullecolors = 7;

    // États du jeu
    var gamestates = { init: 0, ready: 1, shootbulle: 2, removecluster: 3, gameover: 4 };
    var gamestate = gamestates.init;

    // Score
    var score = 0;

    var turncounter = 0;
    var rangeesoffset = 0;

    // Variables d'animation
    var animationstate = 0;
    var animationtime = 0;

    // Groupes de bulles
    var showcluster = false;
    var cluster = [];
    var floatingclusters = [];

// Images
// Tableau des images
var images = [];
// Image de bulle
var bulleimage;

// Variables globales pour le chargement des images
var loadcount = 0;
var loadtotal = 0;
var preloaded = false;

// Charger des images
function loadImages(imagefiles) {
// Initialiser les variables
loadcount = 0;
loadtotal = imagefiles.length;
preloaded = false;

// Charger les images
var loadedimages = [];
for (var i = 0; i < imagefiles.length; i++) {
    // Créer un objet image
    var image = new Image();

    // Ajouter un gestionnaire d'événements onload
    image.onload = function () {
        loadcount++;
        if (loadcount == loadtotal) {
            // Fin du chargement
            preloaded = true;
        }
    };

    // Définir l'URL source de l'image
    image.src = imagefiles[i];

    // Enregistrer dans le tableau des images
    loadedimages[i] = image;
    }

// Retourner un tableau d'images
return loadedimages;
}

// Initialiser le jeu
function init() {
// Charger les images
images = loadImages(["bubble_kvr.png"]);
bulleimage = images[0];
// Ajouter des événements de souris
canvas.addEventListener("mousemove", onMouseMove);
canvas.addEventListener("mousedown", onMouseDown);

// Initialiser le tableau de tuiles bidimensionnelles
for (var i = 0; i < niveau.colonnes; i++) {
    niveau.tuiles[i] = [];
    for (var j = 0; j < niveau.rangees; j++) {
        // Définir un type de tuile et un paramètre de décalage pour l'animation
        niveau.tuiles[i][j] = new Tuile(i, j, 0, 0);
    }
}

niveau.width = niveau.colonnes * niveau.tuilewidth + niveau.tuilewidth / 2;
niveau.height = (niveau.rangees - 1) * niveau.rangeesheight + niveau.tuileheight;

// Initialiser le joueur
joueur.x = niveau.x + niveau.width / 2 - niveau.tuilewidth / 2;
joueur.y = niveau.y + niveau.height;
joueur.angle = 90;
joueur.tuiletype = 0;

joueur.nextbulle.x = joueur.x - 2 * niveau.tuilewidth;
joueur.nextbulle.y = joueur.y;

// Nouveau jeu
newGame();

// Entrer dans la boucle principale
main(0);
}

// Boucle principale
function main(tframe) {
// Demander des images d'animation
window.requestAnimationFrame(main);

// Vérifier si le jeu est initialisé
if (!initialized) {
    // Afficher un écran de chargement
    
    // Effacer le canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dessiner l'image de fond
    drawFrame();
    
    // Dessiner une barre de progression
    var loadpercentage = loadcount / loadtotal;
    context.strokeStyle = "#ff8080";
    context.lineWidth = 3;
    context.strokeRect(18.5, 0.5 + canvas.height - 51, canvas.width - 37, 32);
    context.fillStyle = "#ff8080";
    context.fillRect(18.5, 0.5 + canvas.height - 51, loadpercentage * (canvas.width - 37), 32);
    
    // Afficher le texte de progression
    var loadtext = "Chargé " + loadcount + "/" + loadtotal + " images";
    context.fillStyle = "#000000";
    context.font = "16px Verdana";
    context.fillText(loadtext, 18, 0.5 + canvas.height - 63);
    
    // Si toutes les images sont chargées
    if (preloaded) {
    // Ajouter un délai pour des fins de démonstration
    setTimeout(function () {
    initialized = true;
    }, 1000);
    }
    } else {
    // Mettre à jour et afficher le jeu
    update(tframe);
    render();
    }
} 
    // Mettre à jour l'état du jeu
    function update(tframe) {
    var dt = (tframe - lastframe) / 1000;
    lastframe = tframe;
    
    // Mettre à jour le compteur de fps
    updateFps(dt);
    
    if (gamestate == gamestates.ready) {
    // Le jeu est prêt pour l'entrée du joueur
    } else if (gamestate == gamestates.shootbulle) {
    // La bulle est en mouvement
    stateShootBulle(dt);
    } else if (gamestate == gamestates.removecluster) {
    // Retirer la grappe et faire tomber les tuiles
    stateRemoveCluster(dt);
    }
    }
    
    // Définir l'état du jeu
    function setGameState(newgamestate) {
    gamestate = newgamestate;
    
    animationstate = 0;
    animationtime = 0;
    }
    
    // Fonction pour l'état de la bulle en mouvement
    function stateShootBulle(dt) {
    // La bulle est en mouvement
    
    // Déplacer la bulle dans la direction de la souris
    joueur.bulle.x += dt * joueur.bulle.speed * Math.cos(degToRad(joueur.bulle.angle));
    joueur.bulle.y += dt * joueur.bulle.speed * -1 * Math.sin(degToRad(joueur.bulle.angle));
    
    // Gérer les collisions avec la gauche et la droite du niveau
    if (joueur.bulle.x <= niveau.x) {
    // Bord gauche
    joueur.bulle.angle = 180 - joueur.bulle.angle;
    joueur.bulle.x = niveau.x;
    } else if (joueur.bulle.x + niveau.tuilewidth >= niveau.x + niveau.width) {
    // Bord droit
    joueur.bulle.angle = 180 - joueur.bulle.angle;
    joueur.bulle.x = niveau.x + niveau.width - niveau.tuilewidth;
    }
    
    // Collisions avec le haut du niveau
    if (joueur.bulle.y <= niveau.y) {
    // Collision avec le haut
    joueur.bulle.y = niveau.y;
    snapBulle();
    return;
    }
    // Collisions avec d'autres tuiles
for (var i=0; i<niveau.colonnes; i++) {
    for (var j=0; j<niveau.rangees; j++) {
    var tuile = niveau.tuiles[i][j];

                // Ignorer les tuiles vides
                if (tuile.type < 0) {
                    continue;
                }
                
                // Vérifier s'il y a une intersection
                var coord = getTuileCoordinate(i, j);
                if (circleIntersection(joueur.bulle.x + niveau.tuilewidth/2,
                                       joueur.bulle.y + niveau.tuileheight/2,
                                       niveau.radius,
                                       coord.tuilex + niveau.tuilewidth/2,
                                       coord.tuiley + niveau.tuileheight/2,
                                       niveau.radius)) {
                                        
                    // Intersection avec une bulle de niveau
                    snapBulle();
                    return;
                }
            }
        }
    }
    
    function stateRemoveCluster(dt) {
        if (animationstate == 0) {
            resetRemoved();
            
            // Marquer les tuiles comme retirées
            for (var i=0; i<cluster.length; i++) {
                // Définir le drapeau "removed"
                cluster[i].removed = true;
            }
            
            // Ajouter le score du cluster
            score += cluster.length * 100;
            
            // Trouver des clusters flottants
            floatingclusters = findFloatingClusters();
            
            if (floatingclusters.length > 0) {
                // Mettre en place l'animation de chute
                for (var i=0; i<floatingclusters.length; i++) {
                    for (var j=0; j<floatingclusters[i].length; j++) {
                        var tuile = floatingclusters[i][j];
                        tuile.shift = 0;
                        tuile.shift = 1;
                        tuile.velocity = joueur.bulle.dropspeed;
                        
                        score += 100;
                    }
                }
            }
            
            animationstate = 1;
        }
        
        if (animationstate == 1) {
            // Faire éclater les bulles
            var tuilesleft = false;
            for (var i=0; i<cluster.length; i++) {
                var tuile = cluster[i];
                
                if (tuile.type >= 0) {
                    tuilesleft = true;
                    
                    // Animation alpha
                    tuile.alpha -= dt * 15;
                    if (tuile.alpha < 0) {
                        tuile.alpha = 0;
                    }
    
                    if (tuile.alpha == 0) {
                        tuile.type = -1;
                        tuile.alpha = 1;
                    }
                }                
            }
            
            // Faire tomber les bulles
            for (var i=0; i<floatingclusters.length; i++) {
                for (var j=0; j<floatingclusters[i].length; j++) {
                    var tuile = floatingclusters[i][j];
                    
                    if (tuile.type >= 0) {
                        tuilesleft = true;
                        
                        // Accélérer les tuiles lâchées
                        tuile.velocity += dt * 700;
                        tuile.shift += dt * tuile.velocity;
                            
                        // Animation alpha
                        tuile.alpha -= dt * 8;
                        if (tuile.alpha < 0) {
                            tuile.alpha = 0;
                        }
    
                        // Vérifier si les bulles sont en dessous du bas du niveau
                        if (tuile.alpha == 0 || (tuile.y * niveau.rangeesheight + tuile.shift > (niveau.rangees - 1) * niveau.rangeesheight + niveau.tuileheight)) {
                            tuile.type = -1;
                            tuile.shift = 0;
                            tuile.alpha = 1;
                        } 
                    }

                    }
                }
    // Vérifie s'il reste des bulles sur le plateau
if (!tuilesleft) {
    // Passe à la bulle suivante
    nextBulle();
    
    // Vérifie si le jeu est terminé
var tuilefound = false;
for (var i=0; i<niveau.colonnes; i++) {
    for (var j=0; j<niveau.rangees; j++) {
        if (niveau.tuiles[i][j].type != -1) {
            tuilefound = true;
            break;
        }
    }
}

if (tuilefound) {
    setGameState(gamestates.ready);
} else {
    // Plus de bulles sur le plateau, le jeu est terminé
    setGameState(gamestates.gameover);
            }
        }
     }
    }
// Place la bulle sur la grille
function snapBulle() {
// Obtient la position centrale de la bulle
var centerx = joueur.bulle.x + niveau.tuilewidth/2;
var centery = joueur.bulle.y + niveau.tuileheight/2;
var gridpos = getGridPosition(centerx, centery);
// Vérifie que la position sur la grille est valide
if (gridpos.x < 0) {
    gridpos.x = 0;
}
    
if (gridpos.x >= niveau.colonnes) {
    gridpos.x = niveau.colonnes - 1;
}

if (gridpos.y < 0) {
    gridpos.y = 0;
}
    
if (gridpos.y >= niveau.rangees) {
    gridpos.y = niveau.rangees - 1;
}

// Vérifie si la tuile est vide
var addtuile = false;
if (niveau.tuiles[gridpos.x][gridpos.y].type != -1) {
// La tuile n'est pas vide, décale la nouvelle tuile vers le bas
for (var newrangees=gridpos.y+1; newrangees<niveau.rangees; newrangees++) {
if (niveau.tuiles[gridpos.x][newrangees].type == -1) {
gridpos.y = newrangees;
addtuile = true;
break;
}
}
} else {
addtuile = true;
}
    // Ajoute la tuile à la grille
    if (addtuile) {
        // Cache la bulle du joueur
        joueur.bulle.visible = false;
    
        // Place la tuile
        niveau.tuiles[gridpos.x][gridpos.y].type = joueur.bulle.tuiletype;
        
        // Vérifie si le jeu est terminé
        if (checkGameOver()) {
            return;
        }
        
        // Trouve les groupes de bulles identiques
        cluster = findCluster(gridpos.x, gridpos.y, true, true, false);
        
        if (cluster.length >= 3) {
            // Supprime le groupe de bulles
            setGameState(gamestates.removecluster);
            return;
        }
    }
    
    // Aucun groupe de bulles identiques trouvé
    turncounter++;
    if (turncounter >= 5) {
        // Ajoute une rangée de bulles
        addBulles();
        turncounter = 0;
        rangeesoffset = (rangeesoffset + 1) % 2;
        
        if (checkGameOver()) {
            return;
        } 
    }

    // Passe à la bulle suivante
    nextBulle();
    setGameState(gamestates.ready);
    }

function checkGameOver() {
    // Vérifie si le jeu est terminé
    for (var i=0; i<niveau.colonnes; i++) {
        // Vérifie si la dernière rangée contient des bulles
        if (niveau.tuiles[i][niveau.rangees-1].type != -1) {
            // Le jeu est terminé
            nextBulle();
            setGameState(gamestates.gameover);
            return true;
        }
    }
    
    return false;
}

function addBulles() {
    // Décale les rangées vers le bas
    for (var i=0; i<niveau.colonnes; i++) {
        for (var j=0; j<niveau.rangees-1; j++) {
            niveau.tuiles[i][niveau.rangees-1-j].type = niveau.tuiles[i][niveau.rangees-1-j-1].type;
        }
    }
// Ajouter une nouvelle rangée de bulles en haut
for (var i=0; i<niveau.colonnes; i++) {
    // Ajouter des couleurs existantes et aléatoires
    niveau.tuiles[i][0].type = getExistingColor();
    }
    }

    // Trouver les couleurs restantes
function findColors() {
    var foundcolors = [];
    var colortable = [];
    for (var i=0; i<bullecolors; i++) {
        colortable.push(false);
    }
    
    // Vérifier toutes les tuiles
    for (var i=0; i<niveau.colonnes; i++) {
        for (var j=0; j<niveau.rangees; j++) {
            var tuile = niveau.tuiles[i][j];
            if (tuile.type >= 0) {
                if (!colortable[tuile.type]) {
                    colortable[tuile.type] = true;
                    foundcolors.push(tuile.type);
                }
            }
        }
    }
    
    return foundcolors;
}

// Trouver un cluster à la position de la tuile spécifiée
function findCluster(tx, ty, matchtype, reset, skipremoved) {
    // Réinitialiser les indicateurs traités
    if (reset) {
        resetProcessed();
    }
    
    // Obtenir la tuile cible. Les coordonnées de la tuile doivent être valides.
    var targettuile = niveau.tuiles[tx][ty];
    
    // Initialiser le tableau toprocess avec la tuile spécifiée
    var toprocess = [targettuile];
    targettuile.processed = true;
    var foundcluster = [];

    while (toprocess.length > 0) {
        // Supprimer le dernier élément du tableau
        var currenttuile = toprocess.pop();
        
        // Ignorer les tuiles traitées et vides
        if (currenttuile.type == -1) {
            continue;
        }
        
        // Ignorer les tuiles avec l'indicateur removed
        if (skipremoved && currenttuile.removed) {
            continue;
        }
        
        // Vérifier si la tuile actuelle a le bon type, si matchtype est vrai
        if (!matchtype || (currenttuile.type == targettuile.type)) {
            // Ajouter la tuile actuelle au cluster
            foundcluster.push(currenttuile);
            
            // Obtenir les voisins de la tuile actuelle
            var neighbors = getNeighbors(currenttuile);
            
            // Vérifier le type de chaque voisin
            for (var i=0; i<neighbors.length; i++) {
                if (!neighbors[i].processed) {
                    // Ajouter le voisin au tableau toprocess
                    toprocess.push(neighbors[i]);
                    neighbors[i].processed = true;
                }
            }
        }
    }
    
    // Renvoyer le cluster trouvé
    return foundcluster;
}

// Trouver les clusters flottants
function findFloatingClusters() {
    // Réinitialiser les indicateurs traités
    resetProcessed();
    
    var foundclusters = [];

    //Vérifier toutes les tuiles
    for (var i=0; i<niveau.colonnes; i++) {
    for (var j=0; j<niveau.rangees; j++) {
    var tuile = niveau.tuiles[i][j];
    if (!tuile.processed) {
    // Trouver toutes les tuiles attachées
    var foundcluster = findCluster(i, j, false, false, true);

                    // Il doit y avoir une tuile dans le cluster
                    if (foundcluster.length <= 0) {
                        continue;
                    }
                    
                    // Vérifier si le cluster est flottant
                    var floating = true;
                    for (var k=0; k<foundcluster.length; k++) {
                        if (foundcluster[k].y == 0) {
                            // La tuile est attachée au toit
                            floating = false;
                            break;
                        }
                    }
                    
                    if (floating) {
                        // Cluster flottant trouvé
                        foundclusters.push(foundcluster);
                    }
                }
            }
        }
        
        return foundclusters;
    }
    
    // Réinitialiser les indicateurs de traitement
    function resetProcessed() {
        for (var i=0; i<niveau.colonnes; i++) {
            for (var j=0; j<niveau.rangees; j++) {
                niveau.tuiles[i][j].processed = false;
            }
        }
    }
    
    // Réinitialiser les indicateurs de suppression
    function resetRemoved() {
        for (var i=0; i<niveau.colonnes; i++) {
            for (var j=0; j<niveau.rangees; j++) {
                niveau.tuiles[i][j].removed = false;
            }
        }
    }
    
    // Obtenir les voisins de la tuile spécifiée
    function getNeighbors(tuile) {
        var tuilerangees = (tuile.y + rangeesoffset) % 2; // Rangée paire ou impaire
        var neighbors = [];
        
        // Obtenir les décalages de voisinage pour la tuile spécifiée
        var n = neighborsoffsets[tuilerangees];
        
        // Obtenir les voisins
        for (var i=0; i<n.length; i++) {
            // Coordonnées du voisin
            var nx = tuile.x + n[i][0];
            var ny = tuile.y + n[i][1];
            
            // S'assurer que la tuile est valide
            if (nx >= 0 && nx < niveau.colonnes && ny >= 0 && ny < niveau.rangees) {
                neighbors.push(niveau.tuiles[nx][ny]);
            }
        }
        
        return neighbors;
    }
    
    function updateFps(dt) {
        if (fpstime > 0.25) {
            // Calculer les images par seconde
            fps = Math.round(framecount / fpstime);
            
            // Réinitialiser le temps et le nombre d'images
            fpstime = 0;
            framecount = 0;
        }
        
        // Augmenter le temps et le nombre d'images
        fpstime += dt;
        framecount++;
    }
    
    // Dessiner du texte centré
    function drawCenterText(text, x, y, width) {
        var textdim = context.measureText(text);
        context.fillText(text, x + (width-textdim.width)/2, y);
    }
    
    // Rendre le jeu
    function render() {
        // Dessiner le cadre autour du jeu
        drawFrame();
        
        var yoffset =  niveau.tuileheight/2;
            // Rendre les tuiles
    renderTuiles();
    
    // Dessiner le bas du niveau
    context.fillStyle = "#313131";
    context.fillRect(niveau.x - 4, niveau.y - 4 + niveau.height + 4 - yoffset, niveau.width + 8, 2*niveau.tuileheight + 3);
    
    // Dessiner le score
    context.fillStyle = "#8645C7";
    context.font = "18px Verdana";
    var scorex = niveau.x + niveau.width - 150;
    var scorey = niveau.y+niveau.height + niveau.tuileheight - yoffset - 8;
    drawCenterText("Score:", scorex, scorey, 150);
    context.font = "24px Verdana";
    drawCenterText(score, scorex, scorey+30, 150);

    // Afficher un cluster
if (showcluster) {
    renderCluster(cluster, 255, 128, 128);
    for (var i=0; i<floatingclusters.length; i++) {
        var col = Math.floor(100 + 100 * i / floatingclusters.length);
        renderCluster(floatingclusters[i], col, col, col);
    }
}

// Afficher la bulle du joueur
renderJoueur();

// Superposition de fin de partie
if (gamestate == gamestates.gameover) {
    context.fillStyle = "rgba(0, 0, 0, 0.8)";
    context.fillRect(niveau.x - 4, niveau.y - 4, niveau.width + 8, niveau.height + 2 * niveau.tuileheight + 8 - yoffset);
    
    context.fillStyle = "#8645C7";
    context.font = "24px Verdana";
    drawCenterText("Game Over petit noob!", niveau.x, niveau.y + niveau.height / 2 + 10, niveau.width);
    drawCenterText("Clique pour rejouer", niveau.x, niveau.y + niveau.height / 2 + 40, niveau.width);
}
}

// Dessiner une bordure autour du jeu
function drawFrame() {
// Dessiner l'arrière-plan
context.fillStyle = "#8645C7";
context.fillRect(0, 0, canvas.width, canvas.height);

// Dessiner l'en-tête
context.fillStyle = "#2C2C2C";
context.fillRect(0, 0, canvas.width, 79);

// Dessiner le titre
context.fillStyle = "#8645C7";
context.font = "24px Verdana";
context.fillText("Puzzle Bobble KVR :) ", 10, 37);

// Afficher le nombre d'images par seconde (fps)
context.fillStyle = "#8645C7";
context.font = "12px Verdana";
context.fillText("Fps: " + fps, 13, 57);
}

// Afficher les tuiles
function renderTuiles() {
// De haut en bas
for (var j=0; j<niveau.rangees; j++) {
    for (var i=0; i<niveau.colonnes; i++) {
        // Obtenir la tuile
        var tuile = niveau.tuiles[i][j];
    
        // Obtenir le décalage de la tuile pour l'animation
        var shift = tuile.shift;
        
        // Calculer les coordonnées de la tuile
        var coord = getTuileCoordinate(i, j);
        
        // Vérifier si une tuile est présente
        if (tuile.type >= 0) {
            // Supporter la transparence
            context.save();
            context.globalAlpha = tuile.alpha;
            
            // Dessiner la tuile en utilisant la couleur
            drawBulle(coord.tuilex, coord.tuiley + shift, tuile.type);
            
            context.restore();
        }
    }
}
}
// Rendu du cluster
function renderCluster(cluster, r, g, b) {
    for (var i=0; i<cluster.length; i++) {
    // Calculer les coordonnées de la tuile
    var coord = getTuileCoordinate(cluster[i].x, cluster[i].y);
            // Dessiner la tuile en utilisant la couleur
            context.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
            context.fillRect(coord.tuilex+niveau.tuilewidth/4, coord.tuiley+niveau.tuileheight/4, niveau.tuilewidth/2, niveau.tuileheight/2);
        }
    }
    
    // Rendre la bulle du joueur
    function renderJoueur() {
        var centerx = joueur.x + niveau.tuilewidth/2;
        var centery = joueur.y + niveau.tuileheight/2;
        
        // Dessiner le cercle de fond du joueur
        context.fillStyle = "#7a7a7a";
        context.beginPath();
        context.arc(centerx, centery, niveau.radius+12, 0, 2*Math.PI, false);
        context.fill();
        context.lineWidth = 2;
        context.strokeStyle = "#8c8c8c";
        context.stroke();
    
        // Dessiner l'angle
        context.lineWidth = 2;
        context.strokeStyle = "#0000ff";
        context.beginPath();
        context.moveTo(centerx, centery);
        context.lineTo(centerx + 1.5*niveau.tuilewidth * Math.cos(degToRad(joueur.angle)), centery - 1.5*niveau.tuileheight * Math.sin(degToRad(joueur.angle)));
        context.stroke();
        
        // Dessiner la prochaine bulle
        drawBulle(joueur.nextbulle.x, joueur.nextbulle.y, joueur.nextbulle.tuiletype);
        
        // Dessiner la bulle
        if (joueur.bulle.visible) {
            drawBulle(joueur.bulle.x, joueur.bulle.y, joueur.bulle.tuiletype);
        }
        
    }
// Obtenir les coordonnées de la tuile
function getTuileCoordinate(colonnes, rangees) {
    var tuilex = niveau.x + colonnes * niveau.tuilewidth;
        // Décalage X pour les rangées impaires ou paires
        if ((rangees + rangeesoffset) % 2) {
            tuilex += niveau.tuilewidth/2;
        }
        
        var tuiley = niveau.y + rangees * niveau.rangeesheight;
        return { tuilex: tuilex, tuiley: tuiley };
    }
    
    // Obtenir la position de grille la plus proche
    function getGridPosition(x, y) {
        var gridy = Math.floor((y - niveau.y) / niveau.rangeesheight);
        
        // Vérifier le décalage
        var xoffset = 0;
        if ((gridy + rangeesoffset) % 2) {
            xoffset = niveau.tuilewidth / 2;
        }
        var gridx = Math.floor(((x - xoffset) - niveau.x) / niveau.tuilewidth);
        
        return { x: gridx, y: gridy };
    }
    
    
    // Dessiner la bulle
    function drawBulle(x, y, index) {
        if (index < 0 || index >= bullecolors)
            return;
        
        // Dessiner la bulle
        context.drawImage(bulleimage, index * 40, 0, 40, 40, x, y, niveau.tuilewidth, niveau.tuileheight);
    }
    
    // Commencer une nouvelle partie
    function newGame() {
        // Réinitialiser le score
        score = 0;
        
        turncounter = 0;
        rangeesoffset = 0;
        
        // Définir l'état de jeu à prêt
        setGameState(gamestates.ready);
        
        // Créer le niveau
        createNiveau();
    
        // Initialiser la bulle suivante et définir la bulle courante
        nextBulle();
        nextBulle();
    }
    
    // Créer un niveau aléatoire
    function createNiveau() {
        // Créer un niveau avec des tuiles aléatoires
        for (var j=0; j<niveau.rangees; j++) {
            var randomtuile = randRange(0, bullecolors-1);
            var count = 0;
            for (var i=0; i<niveau.colonnes; i++) {
                if (count >= 2) {
                    // Changer la tuile aléatoire
                    var newtuile = randRange(0, bullecolors-1);
                    
                    // S'assurer que la nouvelle tuile est différente de la tuile précédente
                    if (newtuile == randomtuile) {
                        newtuile = (newtuile + 1) % bullecolors;
                    }
                    randomtuile = newtuile;
                    count = 0;
                }
                count++;
                
                if (j < niveau.rangees/2) {
                    niveau.tuiles[i][j].type = randomtuile;
                } else {
                    niveau.tuiles[i][j].type = -1;
                }
            }
        }
    }
// Créer une bulle aléatoire pour le joueur
function nextBulle() {
    // Définir la bulle courante
    joueur.tuiletype = joueur.nextbulle.tuiletype;
    joueur.bulle.tuiletype = joueur.nextbulle.tuiletype;
    joueur.bulle.x = joueur.x;
    joueur.bulle.y = joueur.y;
    joueur.bulle.visible = true;
    
        // Obtenir un type aléatoire parmi les couleurs existantes
        var nextcolor = getExistingColor();
    
        // Définir la prochaine bulle
        joueur.nextbulle.tuiletype = nextcolor;
    }
    
    // Obtenir une couleur existante aléatoire
    function getExistingColor() {
        existingcolors = findColors();
        
        var bulletype = 0;
        if (existingcolors.length > 0) {
            bulletype = existingcolors[randRange(0, existingcolors.length-1)];
        }
        
        return bulletype;
    }
    
    // Obtenir un entier aléatoire entre low et high, inclusivement
    function randRange(low, high) {
        return Math.floor(low + Math.random()*(high-low+1));
    }
    
    // Tirer la bulle
    function shootBulle() {
        // Tirer la bulle dans la direction de la souris
        joueur.bulle.x = joueur.x;
        joueur.bulle.y = joueur.y;
        joueur.bulle.angle = joueur.angle;
        joueur.bulle.tuiletype = joueur.tuiletype;
    
        // Définir l'état du jeu
        setGameState(gamestates.shootbulle);
    }
    
    // Vérifier si deux cercles se chevauchent
    function circleIntersection(x1, y1, r1, x2, y2, r2) {
        // Calculer la distance entre les centres
        var dx = x1 - x2;
        var dy = y1 - y2;
        var len = Math.sqrt(dx * dx + dy * dy);
        
        if (len < r1 + r2) {
            // Les cercles se chevauchent
            return true;
        }
        
        return false;
    }
    
    // Convertir des radians en degrés
    function radToDeg(angle) {
        return angle * (180 / Math.PI);
    }
    
    // Convertir des degrés en radians
    function degToRad(angle) {
        return angle * (Math.PI / 180);
    }
    
    // Sur le mouvement de la souris
    function onMouseMove(e) {
        // Obtenir la position de la souris
        var pos = getMousePos(canvas, e);
    
        // Obtenir l'angle de la souris
        var mouseangle = radToDeg(Math.atan2((joueur.y+niveau.tuileheight/2) - pos.y, pos.x - (joueur.x+niveau.tuilewidth/2)));
    
        // Convertir la plage en 0, 360 degrés
        if (mouseangle < 0) {
            mouseangle = 180 + (180 + mouseangle);
        }
// Restreindre l'angle à 8, 172 degrés
var lbound = 8;
var ubound = 172;
if (mouseangle > 90 && mouseangle < 270) {
// Gauche
if (mouseangle > ubound) {
mouseangle = ubound;
}
} else {
// Droite
if (mouseangle < lbound || mouseangle >= 270) {
mouseangle = lbound;
}
}
    // Définir l'angle du joueur
    joueur.angle = mouseangle;
}

// Au clic de souris
function onMouseDown(e) {
    // Obtenir la position de la souris
    var pos = getMousePos(canvas, e);
    
    if (gamestate == gamestates.ready) {
        shootBulle();
    } else if (gamestate == gamestates.gameover) {
        newGame();
    }
}

// Obtenir la position de la souris
function getMousePos(canvas, e) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: Math.round((e.clientX - rect.left)/(rect.right - rect.left)*canvas.width),
        y: Math.round((e.clientY - rect.top)/(rect.bottom - rect.top)*canvas.height)
    };
}

// Appeler init pour démarrer le jeu
init();
};

