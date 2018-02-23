const idQuery = `
query ($id: Int) { # Define which variables will be used in the query (id)
  Media (id: $id, type: ANIME) { # Insert our variables into the query arguments (id) (type: ANIME is hard-coded in the query)
    id
    type
    title {
      romaji
      native
    }
  }
}
`;

getById(10087)

function getById(id) {
    // Define our query variables and values that will be used in the query request
    const variables = {
        id: id
    };

    // Define the config we'll need for our Api request
    const url = 'https://graphql.anilist.co';
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            query: idQuery,
            variables: variables
        })
    };

    // Make the HTTP Api request
    fetch(url, options).then((res) => {
        return res.json();
    }).then((res) => {
        console.log(res);
    });
}