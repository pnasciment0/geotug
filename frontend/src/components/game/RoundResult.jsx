import { flagUrl } from '../../utils/flags';
import { describeWinner } from '../../utils/constants';

// Between-rounds summary: who got it, the pull earned, and the revealed answer.
function RoundResult({ result, myRole }) {
    return (
        <div style={{ textAlign: 'center' }}>
            {result.flag && (
                <img src={flagUrl(result.flag, 160)} alt={result.answer} style={{ border: '1px solid #ddd' }} />
            )}
            <h3>
                {result.winnerRole
                    ? `${describeWinner(result.winnerRole, myRole)} got it! (+${result.pull})`
                    : 'Nobody got it.'}
            </h3>
            <p>It was <strong>{result.answer}</strong>.</p>
        </div>
    );
}

export default RoundResult;
