import ChefAvatar from './ChefAvatar'

export default function AvatarReaction({ avatarId, state }) {
  const celebrating = state !== 'failed'

  return (
    <span className={`avatar-reaction avatar-reaction--${state}`} aria-hidden="true">
      <span className="avatar-reaction__shadow" />
      <span className="avatar-reaction__bob">
        <span className="avatar-reaction__gesture">
          {['left', 'right'].map((side) => (
            <span key={side} className={`avatar-reaction__arm avatar-reaction__arm--${side}`}>
              <span className="avatar-reaction__forearm">
                <svg className="avatar-reaction__glove" viewBox="0 0 28 28" focusable="false">
                  <path d="M7 25Q3 23 3 19l-1-6q0-3 3-3l1 3-1-7q0-3 3-3t3 3l1 5V4q0-3 3-3t3 3v7l1-5q1-3 4-2t2 4l-1 7q3-2 4 1 1 3-3 7l-4 3Z" fill="#fffdf3" stroke="#432d35" strokeWidth="2" strokeLinejoin="round" />
                </svg>
                {!celebrating && side === 'right' ? (
                  <svg className="avatar-reaction__flag" viewBox="0 0 35 46" focusable="false">
                    <path d="M6 43V5" stroke="#76533c" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M7 6q8-4 13 0t11 0v15q-6 4-11 0t-13 0Z" fill="#fffdf3" stroke="#b9aaa0" strokeWidth="1.5" />
                  </svg>
                ) : null}
              </span>
            </span>
          ))}
          {['left', 'right'].map((side) => (
            <span key={side} className={`avatar-reaction__leg avatar-reaction__leg--${side}`}>
              <span className="avatar-reaction__shin">
                <svg className="avatar-reaction__shoe" viewBox="0 0 36 22" focusable="false">
                  <path d="M8 3h12l4 7 8 3q4 2 3 6H2q-1-6 6-8Z" fill="#e65d50" stroke="#432d35" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M2 18h33" stroke="#fff9e9" strokeWidth="3" /><path d="m13 7 7 1m-8 3 8 1" stroke="#fff9e9" strokeWidth="1.5" />
                </svg>
              </span>
            </span>
          ))}
          <span className="avatar-reaction__body">
            <ChefAvatar id={avatarId} className="avatar-reaction__avatar" />
            <span className="avatar-reaction__body-light" />
            {celebrating ? (
              <svg className="avatar-reaction__hat" viewBox="0 0 42 36" focusable="false">
                <path d="M6 30 20 3l15 27Z" fill="#f3a43e" stroke="#79442b" strokeWidth="2" strokeLinejoin="round" />
                <path d="m13 19 14 5M17 11l10 4" stroke="#fff1bc" strokeWidth="3" />
                <path d="M5 30h31" stroke="#b84237" strokeWidth="4" strokeLinecap="round" />
                <circle cx="20" cy="4" r="3" fill="#fff1bc" />
              </svg>
            ) : (
              <svg className="avatar-reaction__sweat" viewBox="0 0 18 24" focusable="false">
                <path d="M9 2C7 7 3 12 3 16a6 6 0 0 0 12 0C15 12 11 7 9 2Z" fill="#72bce2" stroke="#417b9b" strokeWidth="1.5" />
                <path d="M6 16q0-2 2-4" fill="none" stroke="#e5f8ff" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
            {state === 'perfect' ? (
              <svg className="avatar-reaction__medal" viewBox="0 0 30 38" focusable="false">
                <path d="m8 3 7 10 7-10 4 2-6 13H10L4 5Z" fill="#e66050" />
                <circle cx="15" cy="23" r="11" fill="#f4c335" stroke="#a56b20" strokeWidth="2" />
                <path d="m15 15 2 5 5 .4-4 3.4 1.3 5-4.3-2.7-4.3 2.7 1.3-5-4-3.4 5-.4z" fill="#fff1ad" />
              </svg>
            ) : null}
          </span>
        </span>
      </span>
      {celebrating ? (
        <>
          <svg className="avatar-reaction__confetti" viewBox="0 0 100 100" focusable="false">
            <g className="avatar-reaction__confetti-burst">
              <path d="m7 26 6-4 3 6-6 4zM83 29l6-3 3 6-6 3z" fill="#e75b56" />
              <path d="m20 6 4 5-5 4-4-5zM88 58l4 4-4 5-4-5z" fill="#f5c338" />
              <path d="M4 54l5-3 3 5-5 3zM70 8l5-4 4 5-5 4z" fill="#79b981" />
              <path d="m32 4 2-5 2 5 5 2-5 2-2 5-2-5-5-2zM80 45l2-5 2 5 5 2-5 2-2 5-2-5-5-2z" fill="#fff0a5" />
              {state === 'perfect' ? <path d="m3 39 5-3 3 5-5 3zM95 18l4 5-5 3-3-5zM14 75l5-4 4 5-5 4zM72 2l3-5 3 5 5 2-5 2-3 5-3-5-5-2z" fill="#f8d250" /> : null}
            </g>
          </svg>
        </>
      ) : (
        <>
          <svg className="avatar-reaction__cloud" viewBox="0 0 64 36" focusable="false">
            <path d="M12 25C2 25 3 14 12 13 14 3 27 2 32 10c7-8 19-4 19 4 11 0 12 11 2 11Z" fill="#6e6a73" stroke="#504b55" strokeWidth="2" />
            <path d="m19 28-2 4m15-4-2 4m15-4-2 4" stroke="#83b5cd" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </>
      )}
    </span>
  )
}
