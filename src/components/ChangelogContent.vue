<template>
  <q-timeline color="secondary">
    <q-timeline-entry
      title="v2.5.0 (Builds 250–271)"
      subtitle="Statblock Overhaul, Full pt-BR UI, Rules Converter & Zero-Any Hardening - 11/2026"
      icon="auto_awesome"
      color="positive"
    >
      <div class="text-body2">
        <ul>
          <li>
            Modular editor & domain decomposition (Builds 256–267: 0 files over
            900 lines), site-wide <code>CatalogSelect</code>, and 100%
            <code>v-help</code> tooltip coverage (556/556 controls).
          </li>
          <li>
            100% Brazilian Portuguese (<code>pt-BR</code>) UI & help dictionary
            (920/920 keys) with Quasar locale synchronization, dark-mode WCAG
            contrast overhaul, AC rider composer with Natural Armor base,
            frameless portrait toggle, and <code>BS-39</code> paired range
            support.
          </li>
          <li>
            Deterministic <code>2014 ↔ 2024</code> rules edition converter with
            loss report, stored-state browser reload E2E verification
            (<code>BS-06</code>), Open5e attack/legendary fixes, and quality
            ratchet at 0 explicit <code>any</code>s and 0 app lint
            suppression comments.
          </li>
        </ul>
      </div>
    </q-timeline-entry>
    <q-timeline-entry
      title="v2.4.3"
      subtitle="Maintenance - 5/17/2026"
      icon="build"
      color="primary"
    >
      <div class="text-body2">
        <ul>
          <li>Fix Open5e monster import.</li>
        </ul>
      </div>
    </q-timeline-entry>
    <q-timeline-entry
      title="v2.4.2"
      subtitle="Minor Update - 3/01/2026"
      icon="build"
      color="primary"
    >
      <div class="text-overline text-uppercase q-mb-sm">
        Bugfixes and Formatting Corrections
      </div>
      <div class="text-body2">
        <ul>
          <li>
            <github-issue-link :issue="174" /> Correct formatting for HP and AC
            labels in 2024 stat block style.
          </li>
          <li>
            <github-issue-link :issue="175" /> Attacks in 2024 format will not
            list the target count unless the target count is larger than one.
          </li>
          <li>
            2024 styled monsters will extend the monster name header across both
            columns.
          </li>
        </ul>
      </div>
    </q-timeline-entry>
    <q-timeline-entry
      title="v2.4.1"
      subtitle="Hotfix - 12/29/2025"
      icon="build"
      color="primary"
    >
      <div class="text-body2">
        <ul>
          <li>
            Hotfix: Add missing version 11 schema so newly saved monsters can
            load.
          </li>
        </ul>
      </div>
    </q-timeline-entry>
    <q-timeline-entry
      title="v2.4.0"
      subtitle="Minor Update - 12/28/2025"
      icon="build"
      color="positive"
    >
      <div class="text-body1 q-mb-sm">
        This update hopefully resolves some of the long-standing issues with PNG
        export in the app, and fixes a number of small formatting details for
        both the 2024 and 2014 stat blocks.
      </div>
      <q-separator class="q-my-sm" />
      <div class="text-overline text-uppercase q-mb-sm">New Features</div>
      <div class="text-body2">
        <ul>
          <li>
            <github-issue-link :issue="166" /> Add override field to skills
            editor to allow conditional bonuses to be listed for individual
            skills.
          </li>
          <li>
            <github-issue-link :issue="159" /> Add option in the rendering
            settings to condense all immunities to one line while using the 2014
            stat block format.
          </li>
        </ul>
      </div>
      <div class="text-overline text-uppercase q-mb-sm">
        Bugfixes and Formatting Corrections
      </div>
      <div class="text-body2">
        <ul>
          <li>
            <github-issue-link :issue="98" />,
            <github-issue-link :issue="160" /> Updated PNG export library in a
            continuing attempt to resolve issues with overlapping text when
            exporting PNGs. If you continue to experience issues with PNG
            export, add an issue on the GitHub page with your browser name and
            version number.
          </li>
          <li>
            <github-issue-link :issue="161" /> Bugfix: resolve issue in web
            renderer where creating a new line in the description would cause
            the first sentence to wrap to a new line.
          </li>
          <li>
            <github-issue-link :issue="158" /> Update spell list to include new
            spells in SRD 5.2.
          </li>
          <li>
            <github-issue-link :issue="165" /> Adjust legendary action and
            reaction section formatting for the 2024 stat block format.
          </li>
          <li>
            <github-issue-link :issue="168" />,
            <github-issue-link :issue="169" />,
            <github-issue-link :issue="170" />
            Fix various minor capitalization issues in stat block web renderer.
          </li>
        </ul>
      </div>
    </q-timeline-entry>
    <q-timeline-entry
      title="v2.3.7"
      subtitle="Maintenance - 10/14/2025"
      icon="build"
      color="primary"
    >
      <div class="text-body2">
        <ul>
          <li>Maintenance: Updating upstream packages.</li>
        </ul>
      </div>
    </q-timeline-entry>
    <q-timeline-entry
      title="v2.3.6"
      subtitle="Hotfix - 4/1/2025"
      icon="build"
      color="primary"
    >
      <div class="text-body2">
        <ul>
          <li>Hotfix: update schema table to validate v10 monsters.</li>
        </ul>
      </div>
    </q-timeline-entry>
    <q-timeline-entry
      title="v2.3.5"
      subtitle="Minor Update - 3/31/2025"
      icon="build"
      color="primary"
    >
      <div class="text-body2">
        <ul>
          <li>
            <github-issue-link :issue="152" /> Add alternate XP/CR value to note
            XP when fighting a monster under certain conditions (in a lair, for
            instance).
          </li>
          <li>
            <github-issue-link :issue="153" /> Add monster nickname. A Nickname
            will override the default value of the {NAME} token, allowing you to
            use a shorter name to reference the monster in the stat block text.
            The full name can always be accessed with {monster.name}.
          </li>
          <li>
            <github-issue-link :issue="154" /> Add Toll the Dead to the SRD
            spells.
          </li>
          <li>
            Added notes about input fields that are actually fully customizable
            even though they look like dropdowns.
          </li>
          <li>
            Added note about PNG export support while using Firefox. Two column
            stat blocks still occasionally have rendering issues.
          </li>
        </ul>
      </div>
    </q-timeline-entry>
    <q-timeline-entry
      title="v2.3.4"
      subtitle="Minor Update - 3/19/2025"
      icon="build"
      color="primary"
    >
      <div class="text-body2">
        <ul>
          <li>
            <github-issue-link :issue="148" /> Bugfix: 2024 immunities now
            properly puts a comma between the damage and condition sections.
          </li>
          <li>
            Changing the number of columns will automatically resize the stat
            block view to fit the changed format.
          </li>
          <li>
            Multiattack actions can now have an entirely custom renderer
            (including the "Multiattack" label). Additionally, the first time
            the custom renderer is opened, the field will pre-fill with the
            default text (so that at least something renders in the stat block).
          </li>
        </ul>
      </div>
    </q-timeline-entry>
    <q-timeline-entry
      title="v2.3.3"
      subtitle="Minor Update - 2/23/2025"
      icon="build"
      color="primary"
    >
      <div class="text-body2">
        <ul>
          <li>
            Bugfix: 2024 formatted statblocks will now show condition immunities
            in the immunities section when there are also no damage immunities.
          </li>
          <li>
            Updated default damage type and status condition text to be
            capitalized, to match new stat block formatting. This will apply to
            both 2014 and 2024 formats. Note that you can still type in any text
            to those fields, in case you want to adjust how those statuses are
            displayed.
          </li>
        </ul>
      </div>
    </q-timeline-entry>
    <q-timeline-entry
      title="v2.3.2"
      subtitle="Minor Update - 2/23/2025"
      icon="build"
      color="primary"
    >
      <div class="text-body2">
        <ul>
          <li>
            <github-issue-link :issue="144" /> Traits section no longer renders
            header when there are no traits and the 2024 format is being used.
          </li>
          <li>
            <github-issue-link :issue="143" /> 2014 formatting now converts text
            back to 2014 versions (specifically around attack language and
            spellcasting).
          </li>
          <li>
            <github-issue-link :issue="145" /> Adjust inventory location in the
            2024 stat block format (now called Gear and located in the top half
            of the stat block).
          </li>
          <li>
            2024 format: Remove "Damage" from the immunities, resistances, and
            vulnerability title. Also consolidated condition immunities and
            damage immunities, as per 2024 format.
          </li>
          <li>
            2024 format: Removed "Innate" from the rendered innate spellcasting
            action title.
          </li>
        </ul>
      </div>
    </q-timeline-entry>
    <q-timeline-entry
      title="v2.3.1"
      subtitle="Hotfix - 12/21/2024"
      icon="build"
      color="primary"
    >
      <div class="text-body2">
        <ul>
          <li>
            Fixed issue with default initiative adding stat score instead of
            stat modifier.
          </li>
        </ul>
      </div>
    </q-timeline-entry>
    <q-timeline-entry
      title="v2.3.0"
      subtitle="Major Update - 12/20/2023"
      icon="update"
      color="positive"
    >
      <div class="text-body1 q-mb-sm">
        This update is a bit in advance of the full 2024 Monster Manual release,
        and lays the foundation for anticipated stat block updates in the 2024
        rules. These updates are based on changes observed in the 2024 Player's
        Handbook. I anticipate a (hopefully) small update once the full Monster
        Manual is released to catch the remainder of the formatting updates,
        probably as they relate to Legendary Actions.
      </div>
      <q-separator class="q-my-sm" />
      <div class="text-overline text-uppercase q-mb-sm">New Features</div>
      <div class="text-body2">
        <ul>
          <li>
            <github-issue-link :issue="128" /> The web renderer stat block can
            now toggle between the 2014 stat block style and the new 2024 stat
            block style. New data fields have been added to the monster stat
            block format to accommodate the new style. The data fields are fully
            backwards compatible.
          </li>
          <li>
            <github-issue-link :issue="131" />Actions that utilize saving throws
            have been overhauled in the 2024 format. Save-based actions can now
            indicate the stat used for the DC (with an optional override), the
            range of the action, and can now explicitly list out the results for
            succeeding, failing, or satisfying some other more complex condition
            on the save (e.g. failing by more than 5). The stat block renderer
            will format this for you. If you do not wish to use this new
            formatting, just leave the save stat as 'none'. This formatting can
            be used in both 2014 and 2024 styles.
          </li>
          <li>
            <github-issue-link :issue="132" /> Reactions now have an explicit
            "Trigger" and a "Response." They can also now have limited uses
            (like normal actions). This formatting will only appear if the
            "Trigger" field has text in it, so to keep using the 2014
            formatting, leave that field blank. This formatting can be used in
            both 2014 and 2024 styles.
          </li>
          <li>
            <github-issue-link :issue="130" /> The 2024 style for the stat block
            has been added. Toggle between 2024 and 2014 styles with the
            settings menu (gear icon, top right). The 2024 style primarily
            affects the header, which has a new table for displaying stats and
            saves, and removes some of the dividers in there. Exports to other
            formats (markdown, LaTeX) should function as they did before.
          </li>
          <li>
            Added Initiative as a skill. Due to the 2024 stat block explicitly
            showing Initiative in the top right of the stat block, Initiative is
            now a skill you can add, give proficiency for, and override as with
            any other skill. In the 2014 stat block, this will appear in the
            Skills section. In the 2024 stat block, this will be omitted from
            the Skills section, as it has its own dedicated location.
          </li>
        </ul>
      </div>
    </q-timeline-entry>
    <q-timeline-entry
      title="v2.2.11"
      subtitle="Bugfix - 12/19/2024"
      icon="build"
      color="primary"
    >
      <div class="text-body2">
        <ul>
          <li>
            <github-issue-link :issue="138" /> Fixed infinite loop in CR
            calculation when legendary action cost was 0. The UI should also now
            prevent you from setting a cost of 0.
          </li>
        </ul>
      </div>
    </q-timeline-entry>
    <q-timeline-entry
      title="v2.2.10"
      subtitle="Bugfix - 11/26/2024"
      icon="build"
      color="primary"
    >
      <div class="text-body2">
        <ul>
          <li>
            <github-issue-link :issue="136" /> Fixed issue where legendary and
            mythic actions menus were not updating after new actions or attacks
            were added.
          </li>
        </ul>
      </div>
    </q-timeline-entry>
    <q-timeline-entry
      title="v2.2.9"
      subtitle="Maintenance Update - 10/21/2024"
      icon="update"
      color="primary"
    >
      <div class="text-body2">
        <ul>
          <li>
            Updating contact methods because I've been missing messages on
            Twitter.
          </li>
        </ul>
      </div>
    </q-timeline-entry>
    <q-timeline-entry
      title="v2.2.8"
      subtitle="Maintenance Update - 4/25/24"
      icon="update"
      color="primary"
    >
      <div class="text-body2">
        <ul>
          <li>
            Just hopping in to update some packages. This shouldn't affect app
            functionality, and if it does let me know!
          </li>
        </ul>
      </div>
    </q-timeline-entry>
    <q-timeline-entry
      title="v2.2.7"
      subtitle="Minor Update - 10/10/23"
      icon="update"
      color="primary"
    >
      <div class="text-body2">
        <ul>
          <li>
            <github-issue-link :issue="111" /> Added an inventory field in case
            you want to write down what additional items or loot your monster
            has. Note that the values written in this field do not affect the
            monster's actual stats.
          </li>
          <li>
            <github-issue-link :issue="115" /> Added XP tokens to better support
            the Mythic Actions preamble. You can now type {XP:[cr]} to render
            the XP corresponding to the listed CR. Adding a + at the end adds
            the specified XP total to the monster's listed CR XP. See the new
            default Mythic Actions preamble to see the tokens in action.
          </li>
          <li>
            <github-issue-link :issue="116" /> The renderer no longer displays
            the die or bonus if you are using 0 dice or a d1 to compute flat
            damage.
          </li>
          <li>
            <github-issue-link :issue="117" /> Bugfix: fixes a crash caused by
            setting the monster's CR to undefined (really, this should be
            disallowed by Quasar but you can apparently make any dropdown null
            by hitting backspace).
          </li>
          <li>
            Dev chores: updated packages, tightened some typescript typedefs.
          </li>
        </ul>
      </div>
    </q-timeline-entry>
    <q-timeline-entry
      title="v2.2.6"
      subtitle="Bugfix - 7/10/23"
      icon="build"
      color="primary"
    >
      <div class="text-body2">
        <ul>
          <li>
            <github-issue-link :issue="112" /> Bugfix: loosened file type filter
            when opening files from disk. There were some reports of being
            unable to open the .5emm.json files.
          </li>
        </ul>
      </div>
    </q-timeline-entry>
    <q-timeline-entry
      title="v2.2.5"
      subtitle="Bugfix - 5/23/23"
      icon="build"
      color="primary"
    >
      <div class="text-body2">
        <ul>
          <li>
            <github-issue-link :issue="107" /> Bugfix: Notes written in the
            additional damage field of an attack now render properly.
          </li>
        </ul>
      </div>
    </q-timeline-entry>
    <q-timeline-entry
      title="v2.2.4"
      subtitle="Minor Update - 4/10/23"
      icon="update"
      color="primary"
    >
      <div class="text-body2">
        <ul>
          <li>
            <github-issue-link :issue="102" /> Bugfix: corrected issue where the
            passive perception override value did not work.
          </li>
          <li>
            <github-issue-link :issue="104" /> Added "Turn" and "Round" ability
            recharge times.
          </li>
          <li>
            <github-issue-link :issue="105" /> Added monster name (v2 format) to
            the monster tokens shortcut menu.
          </li>
        </ul>
      </div>
    </q-timeline-entry>
    <changelog-archive />
  </q-timeline>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import GithubIssueLink from './GithubIssueLink.vue'
import ChangelogArchive from './ChangelogArchive.vue'

export default defineComponent({
  name: 'ChangelogContent',
  components: { GithubIssueLink, ChangelogArchive },
})
</script>
