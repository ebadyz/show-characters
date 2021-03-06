import { useEffect, useReducer } from "react";
import { useNavigate } from "react-router-dom";
import service from "../../services/service";
import { toggleSortOrder } from "../../utils";
import { CharacterStatus } from "../CharacterStatus";
import { Filters } from "../Filters";
import "./style.css";

function sortByOrder(a, b, prop, order) {
  switch (order) {
    case "DESC": {
      return a[prop] < b[prop] ? -1 : 1;
    }
    case "ASC": {
      return a[prop] > b[prop] ? -1 : 1;
    }
    default:
      return 0;
  }
}

function sortAndFilter(array, sortKey, sortOrder, filterKey) {
  let out = array.slice();

  // Apply sort
  out = out.sort((a, b) => sortByOrder(a, b, sortKey, sortOrder));

  // Filter by name or nickname
  if (filterKey) {
    out = out.filter(
      (item) =>
        item.name.toLowerCase().indexOf(filterKey.toLowerCase()) > -1 ||
        item.nickname.toLowerCase().indexOf(filterKey.toLowerCase()) > -1
    );
  }

  return out;
}

export function HomeComponent({ characters, ...filterProps }) {
  const navigate = useNavigate();
  return (
    <>
      <Filters {...filterProps} />
      <main className="container" role="list">
        {characters.map((character) => (
          <article
            role="listitem"
            className="card"
            key={character.char_id}
            onClick={() => navigate(`/quotes/${character.name}`)}
          >
            <section className="card-content col-12">
              <section className="col-xs-12 col-6">
                <img
                  src={character.img}
                  className="avatar"
                  alt={character.name}
                  loading="lazy"
                />
              </section>
              <section className="col-xs-12 col-6 info">
                <section>
                  <p>Name: {character.name}</p>
                </section>
                <section>
                  <p>Nickname: {character.nickname}</p>
                </section>
                <section>
                  <p>Birthday: {character.birthday}</p>
                </section>
                <section>
                  <p>
                    Status: <CharacterStatus status={character.status} />
                  </p>
                </section>
              </section>
            </section>
          </article>
        ))}
      </main>
    </>
  );
}

export default function Home() {
  const initialState = {
    isLoading: true,
    characters: [],
    originalCharacters: [],
    sortKey: null,
    sortOrder: "DESC",
    filterByNameKey: "",
  };
  const reducer = (state, action) => {
    switch (action.type) {
      case "TOGGLE_LOADING": {
        return { ...state, isLoading: action.isLoading };
      }
      case "CHARACTERS": {
        return {
          ...state,
          characters: action.characters,
          originalCharacters: action.characters,
        };
      }
      case "FILTER_BY_NAME_NICKNAME": {
        return {
          ...state,
          filterByNameKey: action.value,
          characters: sortAndFilter(
            state.originalCharacters,
            state.sortOrder,
            state.sortKey,
            action.value
          ),
        };
      }
      case "SORT_KEY": {
        return {
          ...state,
          sortKey: action.value,
          characters: sortAndFilter(
            state.originalCharacters,
            action.value,
            state.sortOrder,
            state.filterByNameKey
          ),
        };
      }
      case "TOGGLE_SORT_ORDER": {
        const sortOrder = toggleSortOrder(state.sortOrder);
        return {
          ...state,
          sortOrder,
          characters: sortAndFilter(
            state.originalCharacters,
            state.sortKey,
            sortOrder,
            state.filterByNameKey
          ),
        };
      }
      default:
        return state;
    }
  };
  const [state, dispatch] = useReducer(reducer, initialState);

  const getCharacters = async () => {
    try {
      const res = await service.getCharacters();
      dispatch({ type: "CHARACTERS", characters: res });
    } catch (err) {
      console.warn(err);
    } finally {
      dispatch({ type: "TOGGLE_LOADING", isLoading: false });
    }
  };

  useEffect(() => {
    getCharacters();
  }, []);

  if (state.isLoading) return <p className="center">loading...</p>;
  else
    return (
      <HomeComponent
        characters={state.characters}
        filterKey={state.filterByNameKey}
        sortKey={state.sortKey}
        sortOrder={state.sortOrder}
        onFilterChange={(key) =>
          dispatch({
            type: "FILTER_BY_NAME_NICKNAME",
            value: key,
          })
        }
        onSortOrderToggle={() => {
          dispatch({ type: "TOGGLE_SORT_ORDER" });
        }}
        onSortKeySelect={(key) => dispatch({ type: "SORT_KEY", value: key })}
      />
    );
}
