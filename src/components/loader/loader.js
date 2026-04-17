import './loader.css'

export class Loader {
    constructor(idContenedor) {
        this.idContenedor = idContenedor;
        this.loaderElement = null;
    }

    show() {
        // Verificar si el contenedor existe
        const contenedor = document.getElementById(this.idContenedor);
        if (!contenedor) {
            console.error(`No se encontró el contenedor con id: ${this.idContenedor}`);
            return;
        }

        // Evitar crear múltiples loaders
        if (this.loaderElement) {
            console.warn('El loader ya está visible');
            return;
        }

        // Crear el elemento del loader
        this.loaderElement = document.createElement('div');
        this.loaderElement.className = 'loader-overlay';
        this.loaderElement.innerHTML = `
            <div class="loader-spinner">
                <div class="spinner"></div>
            </div>
        `;

        // Agregar el loader al contenedor
        contenedor.appendChild(this.loaderElement);
    }

    hide() {
        if (this.loaderElement && this.loaderElement.parentNode) {
            this.loaderElement.parentNode.removeChild(this.loaderElement);
            this.loaderElement = null;
        }
    }

    // Método adicional para verificar si el loader está visible
    isVisible() {
        return this.loaderElement !== null;
    }
}