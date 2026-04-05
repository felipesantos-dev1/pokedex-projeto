const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/pokemon';

/**
 * Busca os dados do Pokémon na PokéAPI
 * @param {string|number} query - Nome ou ID do Pokémon
 * @returns {Promise<Object|null>} Dados brutos da API ou null em caso de erro
 */
async function fetchPokemonData(query) {
    if (!query) return null;
    
    try {
        const response = await fetch(`${POKEAPI_BASE_URL}/${query.toLowerCase()}`);
        if (!response.ok) {
            throw new Error('Pokémon não encontrado!');
        }
        return await response.json();
    } catch (error) {
        console.error("Erro na busca:", error);
        return null;
    }
}

/**
 * Filtra e abstrai apenas os dados necessários (ID, Nome, Tipos, Imagem)
 * @param {Object} data - Dados brutos da PokéAPI
 * @returns {Object|null} Objeto limpo apenas com o que precisamos
 */
function extractPokemonDetails(data) {
    if (!data) return null;
    
    return {
        id: data.id,
        name: data.name,
        // Prioriza a imagem oficial com melhor qualidade, se falhar, pega a padrão
        image: data.sprites?.other?.['official-artwork']?.front_default || data.sprites?.front_default,
        types: data.types.map(typeInfo => typeInfo.type.name)
    };
}

/**
 * Renderiza os dados do Pokémon na tela
 * @param {Object} pokemon - Objeto padronizado com os detalhes do Pokémon
 */
function renderPokemonProfile(pokemon) {
    const resultCard = document.getElementById('resultCard');
    const idElement = document.getElementById('pokedexId');
    const nameElement = document.getElementById('pokemonName');
    const imageElement = document.getElementById('pokemonImage');
    const typesContainer = document.getElementById('pokemonTypes');

    if (!pokemon) {
        alert('Pokémon não encontrado. Verifique o nome ou número e tente novamente.');
        resultCard.classList.add('hidden');
        return;
    }

    // Formata o ID para sempre ter 3 casas (ex: #001)
    idElement.textContent = `#${pokemon.id.toString().padStart(3, '0')}`;
    
    // Capitaliza a primeira letra do nome
    nameElement.textContent = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);
    
    // Preenche a imagem
    imageElement.src = pokemon.image;
    imageElement.alt = `Imagem do Pokémon ${pokemon.name}`;
    
    // Limpa os tipos antigos e renderiza os novos
    typesContainer.innerHTML = '';
    pokemon.types.forEach(type => {
        const typeBadge = document.createElement('span');
        typeBadge.className = `type-badge ${type}`;
        typeBadge.textContent = type;
        typesContainer.appendChild(typeBadge);
    });

    // Mostra o card de resultado com animação
    resultCard.classList.remove('hidden');
    resultCard.classList.remove('pop-animation');
    void resultCard.offsetWidth; // Força o navegador a reiniciar a animação
    resultCard.classList.add('pop-animation');
}

/**
 * Fluxo principal da busca
 */
async function handleSearch() {
    const inputElement = document.getElementById('pokemonInput');
    const query = inputElement.value.trim();
    
    if (!query) {
        alert('Por favor, digite um nome ou ID de Pokémon.');
        return;
    }

    const rawData = await fetchPokemonData(query);
    const pokemonDetails = extractPokemonDetails(rawData);
    renderPokemonProfile(pokemonDetails);
}

let allPokemonList = [];

/**
 * Carrega todos os Pokémon para as sugestões
 */
async function loadPokemonList() {
    try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=10000');
        const data = await response.json();
        allPokemonList = data.results.map(p => p.name);
    } catch (error) {
        console.error("Erro ao carregar sugestões:", error);
    }
}

/**
 * Adiciona os ouvintes de eventos da página
 */
function setupEventListeners() {
    loadPokemonList();

    const searchBtn = document.getElementById('searchBtn');
    const pokemonInput = document.getElementById('pokemonInput');
    const suggestionsList = document.getElementById('suggestionsList');

    searchBtn.addEventListener('click', handleSearch);
    
    // Permite buscar apertando 'Enter' no campo de texto
    pokemonInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleSearch();
            suggestionsList.style.display = 'none';
        }
    });

    // Filtra sugestões
    pokemonInput.addEventListener('input', (event) => {
        const query = event.target.value.toLowerCase().trim();
        suggestionsList.innerHTML = '';
        
        if (query.length === 0) {
            suggestionsList.style.display = 'none';
            return;
        }

        const filtered = allPokemonList.filter(name => name.includes(query)).slice(0, 6);
        
        if (filtered.length > 0) {
            suggestionsList.style.display = 'block';
            filtered.forEach(name => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.textContent = name;
                
                item.addEventListener('click', () => {
                    pokemonInput.value = name;
                    suggestionsList.style.display = 'none';
                    handleSearch();
                });
                
                suggestionsList.appendChild(item);
            });
        } else {
            suggestionsList.style.display = 'none';
        }
    });

    // Fecha ao clicar fora
    document.addEventListener('click', (event) => {
        if (event.target !== pokemonInput && event.target !== suggestionsList) {
            suggestionsList.style.display = 'none';
        }
    });
}

// Inicializa o sistema assim que a página carregar
document.addEventListener('DOMContentLoaded', setupEventListeners);
