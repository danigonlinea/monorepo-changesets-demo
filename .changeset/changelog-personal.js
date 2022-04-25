const { getInfo, getInfoFromPullRequest } = require("@changesets/get-github-info");
require("dotenv").config();


const getReleaseLine = async (changeset, type, options) => {
   if (!options || !options.repo) {
      throw new Error(
        'Please provide a repo to this changelog generator'
      );
    }

    let prFromSummary = undefined;
    let commitFromSummary = undefined;
    let usersFromSummary = [];

    console.log('********** getReleaseLine')
    console.log(JSON.stringify(changeset));
    console.log(type);

    const replacedChangelog = changeset.summary
      .replace(/^\s*(?:pr|pull|pull\s+request):\s*#?(\d+)/im, (_, pr) => {
        let num = Number(pr);
        if (!isNaN(num)) prFromSummary = num;
        return "";
      })
      .replace(/^\s*commit:\s*([^\s]+)/im, (_, commit) => {
        commitFromSummary = commit;
        return "";
      })
      .replace(/^\s*(?:author|user):\s*@?([^\s]+)/gim, (_, user) => {
        usersFromSummary.push(user);
        return "";
      })
      .trim();

    const [firstLine, ...futureLines] = replacedChangelog
      .split("\n")
      .map(l => l.trimRight());

    const links = await (async () => {

      console.log('prFromSummary', prFromSummary);
      console.log('commitFromSummary', commitFromSummary);


      if (prFromSummary !== undefined) {
      
        let { user, commit, links } = await getInfoFromPullRequest({
          repo: options.repo,
          pull: prFromSummary
        });

        console.log('---------- prFromSummary')
        console.log(user, commit);
        console.log(JSON.stringify(links))
        console.log('---------- ')

        
        if (commitFromSummary) {
          links = {
            ...links,
            commit: `[\`${commitFromSummary}\`](https://github.com/${options.repo}/commit/${commitFromSummary})`
          };
        }
        
        return links;
       }

      const commitToFetchFrom = commitFromSummary || changeset.commit;

      console.log('commitToFetchFrom', commitToFetchFrom);
      if (commitToFetchFrom) {
        let { user: user2, pull, links: links2 } = await getInfo({
          repo: options.repo,
          commit: commitToFetchFrom
        });
      
       console.log('---------- commitToFetchFrom')
        console.log(user2, pull);
        console.log(JSON.stringify(links2))
        console.log('---------- ')
      
        // return links;
      }
      
      return {  
        commit: null,
        pull: null,
        user: null
      };
    })();

    const users = usersFromSummary.length
      ? usersFromSummary
          .map(
            userFromSummary =>
              `[@${userFromSummary}](https://github.com/${userFromSummary})`
          )
          .join(", ")
      : links.user;

    const prefix = [
      links.pull === null ? "" : ` ${links.pull}`,
      links.commit === null ? "" : ` ${links.commit}`,
      users === null ? "" : ` Thanks ${users}!`
    ].join("");

    return `\n\n-${prefix ? `${prefix} -` : ""} ${firstLine}\n${futureLines
      .map(l => `  ${l}`)
      .join("\n")}`;
};

const getDependencyReleaseLine = async ( changesets,
    dependenciesUpdated,
    options) => {
  
   if (!options.repo) {
      throw new Error(
        'Please provide a repo to this changelog generator like this:\n"changelog": ["@changesets/changelog-github", { "repo": "org/repo" }]'
      );
    }
    if (dependenciesUpdated.length === 0) return "";

    console.log('********** getDependencyReleaseLine')
    console.log(JSON.stringify(changesets));
    console.log('----------')

   /*  const linkToUpdatedDependencies = (
      await Promise.all(
        changesets.map(async cs => {
          if (cs.commit) {
            let { links } = await getInfo({
              repo: options.repo,
              commit: cs.commit
            });
            return links.commit;
          }
        })
      )
    )
      .filter(_ => _)
      .join(", ") */

    const changesetLink = `- Updated dependencies:`;

    const updatedDepenenciesList = dependenciesUpdated.map(
      dependency => `  - ${dependency.name}@${dependency.newVersion}`
    );

    return [changesetLink, ...updatedDepenenciesList].join("\n");
  
};

module.exports = {
  getReleaseLine,
  getDependencyReleaseLine
}

/* const changelogFunctions = {
  getDependencyReleaseLine: async (
    changesets,
    dependenciesUpdated,
    options
  ) => {
  },
  getReleaseLine: async (changeset, type, options) => {
   
  }
};

export default changelogFunctions; */